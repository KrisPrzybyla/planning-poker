import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import {
  connectRedis,
  disconnectRedis,
  getRoom,
  saveRoom,
  deleteRoom,
  roomExists,
  listRoomIds,
  countRooms,
  withRoomLock,
} from './roomStore.js';

// Named to avoid colliding with the __filename/__dirname CommonJS provides
// implicitly — Jest's test transform compiles this file to CJS, and a
// same-named const there would shadow/clash with Node's own binding.
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);

const app = express();
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN || false : '*',
    credentials: false,
  })
);
app.use(express.json());

// Access log (errors-only by default) with sampling and health exclusion
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', true);
}

const accessLogEnabled = (process.env.ACCESS_LOG_ENABLED || 'true') === 'true';
const accessLogErrorsOnly = (process.env.ACCESS_LOG_ERRORS_ONLY || 'true') === 'true';
const accessLogSample = Math.max(0, Math.min(100, Number(process.env.ACCESS_LOG_SAMPLE) || 100));
const accessLogSlowMs = Math.max(0, Number(process.env.ACCESS_LOG_SLOW_MS) || 0);

app.use('/api', (req, res, next) => {
  if (!accessLogEnabled) return next();
  if (req.path === '/health') return next();

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const status = res.statusCode;

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // Only log when:
    // - errorsOnly = true and status >= 400, or
    // - errorsOnly = false and (sampling passed) and (if slowMs threshold is set, duration >= slowMs)
    if (accessLogErrorsOnly) {
      if (status < 400) return;
    } else {
      if (accessLogSample < 100 && Math.random() * 100 >= accessLogSample) return;
      if (accessLogSlowMs > 0 && durationMs < accessLogSlowMs) return;
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    logger.info('http_request', {
      method: req.method,
      path: req.originalUrl || req.url,
      status,
      durationMs: Math.round(durationMs),
      ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
});

// Basic rate limiting for API endpoints (simple in-memory)
const apiRateLimits = new Map();
const API_WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS) || 60 * 1000;
const API_MAX_REQUESTS = Number(process.env.API_RATE_MAX) || 180;
app.use('/api/', (req, res, next) => {
  // Exclude health endpoint from rate limiting to avoid false alarms
  if (req.path === '/health') return next();

  const now = Date.now();
  const key = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  let entry = apiRateLimits.get(key);
  if (!entry || now - entry.start > API_WINDOW_MS) {
    entry = { count: 0, start: now };
  }
  entry.count += 1;
  apiRateLimits.set(key, entry);
  if (entry.count > API_MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests' });
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let activeRooms = null;
  let redisStatus = 'active';
  try {
    activeRooms = await countRooms();
  } catch (error) {
    redisStatus = 'error';
    logger.error('Health check: Redis unreachable', { message: error?.message });
  }

  // Rooms live in Redis — if it's unreachable the app can't function, so
  // report 503 (not a 200). This lets the Docker healthcheck / load balancer
  // actually notice, instead of a soft "degraded" body behind a 200.
  const healthy = redisStatus === 'active';
  const healthStatus = {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'redis',
      redis: redisStatus,
      socketio: 'active',
      express: 'active',
    },
    stats: {
      activeRooms,
      totalConnections: io.engine.clientsCount,
    },
  };

  res.status(healthy ? 200 : 503).json(healthStatus);
});

// API endpoint to get server stats
app.get('/api/stats', async (req, res) => {
  try {
    const roomIds = await listRoomIds();
    const roomsData = (
      await Promise.all(
        roomIds.map(async (id) => {
          const room = await getRoom(id);
          if (!room) return null;
          return {
            id,
            userCount: room.users.length,
            isVotingActive: room.isVotingActive,
            hasStory: !!room.currentStory,
          };
        })
      )
    ).filter(Boolean);

    res.status(200).json({
      activeRooms: roomIds.length,
      totalConnections: io.engine.clientsCount,
      rooms: roomsData,
    });
  } catch (error) {
    logger.error('Stats endpoint: Redis unreachable', { message: error?.message });
    res.status(503).json({ error: 'Stats temporarily unavailable' });
  }
});

// Serve static files from the dist directory with cache headers optimized for Cloudflare
app.use(
  express.static(path.join(currentDirname, 'dist'), {
    setHeaders: (res, filePath) => {
      const rel = filePath.replace(path.join(currentDirname, 'dist'), '');
      // HTML: never cache (always revalidate)
      if (rel.endsWith('.html') || rel === '' || rel === '/' || rel === '/index.html') {
        res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
        return;
      }
      // Fingerprinted static assets (Vite: dist/assets/*-<hash>.<ext>)
      if (rel.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        return;
      }
      // Other static files: short cache (safe default)
      res.setHeader('Cache-Control', 'public, max-age=300');
    },
  })
);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN || false : '*',
    methods: ['GET', 'POST'],
  },
});

// Tracks the current live socket for each userId, so a stale connection's
// belated 'disconnect' event (e.g. ping timeout on a link the client already
// replaced with a fresh reconnect) can't clobber a newer, healthy session.
const activeSockets = new Map();

// Allowed vote values (Planning Poker)
const ALLOWED_VOTES = new Set(['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕']);

// How long a disconnected original Scrum Master gets before someone else is
// promoted to Temporary Scrum Master, and how long any disconnected user gets
// before being removed from the room permanently. Both are enforced by the
// presence sweep below, not by per-disconnect timers.
const DISPLACED_SM_PROMOTION_MS = 2000;
const DISCONNECT_REMOVAL_MS = 30000;
const PRESENCE_SWEEP_INTERVAL_MS = 2000;

// Caps on user-supplied strings that are stored in Redis and broadcast to
// everyone in a room. Without these, a single client could bloat room state
// (and every other participant's payload) with arbitrarily long input.
const MAX_NAME_LENGTH = 40;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

// Coerce to string, trim, and hard-cap length. Sanitizing (rather than
// rejecting) keeps the UX forgiving while bounding what we persist/broadcast.
function sanitizeText(value, maxLength) {
  return String(value ?? '')
    .trim()
    .slice(0, maxLength);
}

// Generate a random 6-character room code
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Create a new, unused room code
async function createUniqueRoomCode() {
  let code;
  do {
    code = generateRoomCode();
  } while (await roomExists(code));
  return code;
}

// Periodically re-evaluates every room's disconnected users and applies the
// same promotion/removal rules that used to live in a fresh setTimeout per
// disconnect event. Reading current state from Redis on every tick (instead
// of closing over state captured at disconnect time) is what makes this
// immune to the stale-timer class of bug: there's nothing to go stale.
async function runPresenceSweep() {
  let roomIds;
  try {
    roomIds = await listRoomIds();
  } catch (error) {
    logger.error('Presence sweep: failed to list rooms', { message: error?.message });
    return;
  }

  for (const roomId of roomIds) {
    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) {
          // Key expired (TTL) or was deleted, but its set membership lingered
          // — prune the ghost so listRoomIds/countRooms stay accurate.
          await deleteRoom(roomId);
          return;
        }

        const now = Date.now();
        let changed = false;
        const notifications = [];

        // Promote a Temporary Scrum Master if the original is still away
        for (const user of room.users) {
          if (
            user.role === 'Displaced Scrum Master' &&
            !user.isConnected &&
            now - user.disconnectedAt >= DISPLACED_SM_PROMOTION_MS
          ) {
            const candidate = room.users.find((u) => u.isConnected && u.id !== user.id);
            if (candidate) {
              candidate.role = 'Temporary Scrum Master';
              changed = true;
              notifications.push({
                newScrumMaster: candidate,
                reason: 'original_disconnected',
                originalScrumMaster: user,
              });
              logger.info('Temporary Scrum Master promoted', { roomId, userName: candidate.name });
            }
          }
        }

        // Permanently remove users who never came back
        const toRemove = room.users.filter(
          (u) => !u.isConnected && now - u.disconnectedAt >= DISCONNECT_REMOVAL_MS
        );

        for (const user of toRemove) {
          room.users = room.users.filter((u) => u.id !== user.id);
          activeSockets.delete(user.id);
          changed = true;
          logger.info('User removed after timeout', { roomId, userName: user.name });

          if (room.users.length === 0) {
            await deleteRoom(roomId);
            logger.info('Room removed (empty)', { roomId });
            return;
          }

          if (
            ['Scrum Master', 'Displaced Scrum Master', 'Temporary Scrum Master'].includes(user.role)
          ) {
            const promoted = room.users.find((u) => u.isConnected);
            if (promoted) {
              promoted.role = 'Scrum Master';
              notifications.push({
                newScrumMaster: promoted,
                reason: 'permanent_promotion',
                removedUser: user,
              });
              logger.info('Scrum Master promoted (permanent)', { roomId, userName: promoted.name });
            }
          }
        }

        if (changed) {
          await saveRoom(room);
          notifications.forEach((data) => io.to(roomId).emit('scrumMasterChanged', data));
          io.to(roomId).emit('roomUpdated', room);
        }
      });
    } catch (error) {
      logger.error('Presence sweep failed for room', { roomId, message: error?.message });
    }
  }
}

// Runs once at startup, after Redis is connected but before we accept
// connections. Any room persisted from a previous process generation still
// has users flagged isConnected: true, but there are zero live sockets now —
// so mark everyone disconnected. Users whose browsers auto-reconnect flip
// back to connected via rejoinRoom; those who never return are reclaimed by
// the presence sweep after the normal grace period. Without this, a
// non-returning user would stay 'connected' forever and their room would
// never empty — a slow Redis leak that the whole persistence change would
// otherwise have introduced.
async function reconcileOnStartup() {
  let roomIds;
  try {
    roomIds = await listRoomIds();
  } catch (error) {
    logger.error('Startup reconciliation: failed to list rooms', { message: error?.message });
    return;
  }

  const now = Date.now();
  let reconciled = 0;

  for (const roomId of roomIds) {
    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) {
          await deleteRoom(roomId); // prune ghost
          return;
        }

        let changed = false;
        for (const user of room.users) {
          if (user.isConnected) {
            user.isConnected = false;
            user.disconnectedAt = now;
            changed = true;
          }
        }

        if (changed) {
          await saveRoom(room);
          reconciled += 1;
        }
      });
    } catch (error) {
      logger.error('Startup reconciliation failed for room', { roomId, message: error?.message });
    }
  }

  logger.info('Startup reconciliation complete', { rooms: roomIds.length, reconciled });
}

io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });

  // Create a new room
  socket.on('createRoom', async ({ userName: rawUserName, initialStory }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const userName = sanitizeText(rawUserName, MAX_NAME_LENGTH);
      if (!userName) {
        ack({ success: false, error: 'Name is required' });
        return;
      }

      const roomId = await createUniqueRoomCode();
      const userId = uuidv4();

      const user = {
        id: userId,
        name: userName,
        role: 'Scrum Master', // Creator is always Scrum Master
        roomId,
        isConnected: true,
      };

      const room = {
        id: roomId,
        users: [user],
        currentStory: null,
        isVotingActive: false,
        isResultsVisible: false,
        votingCount: 0, // Counter for auto-naming votings
      };

      // If initialStory is provided, start voting immediately
      if (initialStory) {
        room.votingCount = 1;
        const title = sanitizeText(initialStory.title, MAX_TITLE_LENGTH);
        room.currentStory = {
          id: uuidv4(),
          title: title || `Voting #${room.votingCount}`,
          description: sanitizeText(initialStory.description, MAX_DESCRIPTION_LENGTH),
          votes: [],
        };
        room.isVotingActive = true;
        room.isResultsVisible = false;
      }

      await saveRoom(room);

      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;
      activeSockets.set(userId, socket.id);

      ack({ success: true, roomId, user });
      io.to(roomId).emit('roomUpdated', room);

      logger.info('Room created', { roomId, userName });
      if (room.currentStory) {
        logger.info('Voting started', { roomId, storyTitle: room.currentStory.title });
      }
    } catch (error) {
      logger.error('Error creating room', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      ack({ success: false, error: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on('joinRoom', async ({ roomId, userName: rawUserName }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const userName = sanitizeText(rawUserName, MAX_NAME_LENGTH);
      if (!userName) {
        ack({ success: false, error: 'Name is required' });
        return;
      }

      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) {
          ack({ success: false, error: 'Room not found' });
          return;
        }

        const userId = uuidv4();
        const user = {
          id: userId,
          name: userName,
          role: 'Participant', // Joiners are always Participants
          roomId,
          isConnected: true,
        };

        room.users.push(user);
        await saveRoom(room);

        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;
        activeSockets.set(userId, socket.id);

        ack({ success: true, user });
        io.to(roomId).emit('roomUpdated', room);

        logger.info('User joined room', { roomId, userName });
      });
    } catch (error) {
      logger.error('Error joining room', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      ack({ success: false, error: 'Failed to join room' });
    }
  });

  // Rejoin an existing room (for page refresh)
  socket.on('rejoinRoom', async ({ roomId, userId }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) {
          logger.warn('Rejoin failed: room not found', { roomId, userId });
          ack({ success: false, error: 'Room not found' });
          return;
        }

        const user = room.users.find((u) => u.id === userId);
        if (!user) {
          logger.warn('Rejoin failed: user not found in room', { roomId, userId });
          ack({ success: false, error: 'User not found in room' });
          return;
        }

        // Mark user as connected
        user.isConnected = true;
        delete user.disconnectedAt;
        activeSockets.set(userId, socket.id);

        // If rejoining user is displaced Scrum Master, restore their role
        let scrumMasterRestoredEvent = null;
        if (user.role === 'Displaced Scrum Master') {
          const tempSM = room.users.find((u) => u.role === 'Temporary Scrum Master');
          if (tempSM) {
            tempSM.role = 'Participant';
            logger.info('Temporary Scrum Master demoted to Participant', {
              roomId,
              userName: tempSM.name,
            });
          }

          user.role = 'Scrum Master';
          logger.info('Original Scrum Master restored', { roomId, userName: user.name });

          scrumMasterRestoredEvent = {
            newScrumMaster: user,
            reason: 'original_reconnected',
            previousTempScrumMaster: tempSM,
          };
        }

        await saveRoom(room);

        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;

        ack({ success: true, user });

        if (scrumMasterRestoredEvent) {
          io.to(roomId).emit('scrumMasterChanged', scrumMasterRestoredEvent);
        }
        io.to(roomId).emit('roomUpdated', room);

        logger.info('User rejoined room', { roomId, userName: user?.name });
      });
    } catch (error) {
      logger.error('Error rejoining room', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      ack({ success: false, error: 'Failed to rejoin room' });
    }
  });

  // Start voting on a story
  socket.on('startVoting', async ({ roomId, story }) => {
    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) return;

        const userId = socket.data.userId;
        const user = room.users.find((u) => u.id === userId);
        if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master'))
          return;

        room.votingCount = (room.votingCount || 0) + 1;
        const title = sanitizeText(story.title, MAX_TITLE_LENGTH);
        const storyTitle = title || `Voting #${room.votingCount}`;

        room.currentStory = {
          id: uuidv4(),
          title: storyTitle,
          description: sanitizeText(story.description, MAX_DESCRIPTION_LENGTH),
          votes: [],
        };
        room.isVotingActive = true;
        room.isResultsVisible = false;

        await saveRoom(room);
        io.to(roomId).emit('roomUpdated', room);

        logger.info('Voting started', { roomId, storyTitle });
      });
    } catch (error) {
      logger.error('Error starting voting', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }
  });

  // Submit a vote
  socket.on('submitVote', async ({ roomId, value }) => {
    try {
      // Identity comes from the authenticated socket, never the payload —
      // otherwise a client could cast votes as any userId it knows.
      const userId = socket.data.userId;
      if (!userId) return;

      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) return;
        if (!room.isVotingActive || !room.currentStory) return;

        const userExists = room.users.some((u) => u.id === userId);
        if (!userExists) return;

        const valueStr = String(value);
        if (!ALLOWED_VOTES.has(valueStr)) {
          logger.warn('Rejected invalid vote value', { roomId, userId, value: valueStr });
          return;
        }

        room.currentStory.votes = room.currentStory.votes.filter((v) => v.userId !== userId);
        room.currentStory.votes.push({ userId, value: valueStr });

        await saveRoom(room);
        io.to(roomId).emit('roomUpdated', room);

        logger.info('Vote submitted', { roomId, userId, value: valueStr });
      });
    } catch (error) {
      logger.error('Error submitting vote', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }
  });

  // Reveal voting results
  socket.on('revealResults', async ({ roomId }) => {
    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) return;

        const userId = socket.data.userId;
        const user = room.users.find((u) => u.id === userId);
        if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master'))
          return;

        room.isResultsVisible = true;

        await saveRoom(room);
        io.to(roomId).emit('roomUpdated', room);

        logger.info('Results revealed', { roomId });
      });
    } catch (error) {
      logger.error('Error revealing results', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }
  });

  // Reset voting
  socket.on('resetVoting', async ({ roomId }) => {
    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) return;

        const userId = socket.data.userId;
        const user = room.users.find((u) => u.id === userId);
        if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master'))
          return;

        if (room.currentStory) {
          room.currentStory.votes = [];
        }
        room.isVotingActive = true;
        room.isResultsVisible = false;

        await saveRoom(room);
        io.to(roomId).emit('roomUpdated', room);

        logger.info('Voting reset', { roomId });
      });
    } catch (error) {
      logger.error('Error resetting voting', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }
  });

  // End session
  socket.on('endSession', async ({ roomId }) => {
    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) return;

        const user = room.users.find((u) => u.id === socket.data.userId);
        if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master'))
          return;

        io.to(roomId).emit('sessionEnded');
        room.users.forEach((u) => activeSockets.delete(u.id));
        await deleteRoom(roomId);
        logger.info('Session ended', { roomId });
      });
    } catch (error) {
      logger.error('Error ending session', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }
  });

  // Remove user from room (only Scrum Master can do this)
  socket.on('removeUser', async ({ roomId, userIdToRemove }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      await withRoomLock(roomId, async () => {
        const room = await getRoom(roomId);
        if (!room) {
          ack({ success: false, error: 'Room not found' });
          return;
        }

        const requestingUserId = socket.data.userId;
        const requestingUser = room.users.find((u) => u.id === requestingUserId);
        if (
          !requestingUser ||
          (requestingUser.role !== 'Scrum Master' &&
            requestingUser.role !== 'Temporary Scrum Master')
        ) {
          ack({ success: false, error: 'Only Scrum Master can remove users' });
          return;
        }

        const userToRemoveIndex = room.users.findIndex((u) => u.id === userIdToRemove);
        if (userToRemoveIndex === -1) {
          ack({ success: false, error: 'User not found' });
          return;
        }

        const userToRemove = room.users[userToRemoveIndex];

        if (
          userToRemove.role === 'Scrum Master' ||
          userToRemove.role === 'Temporary Scrum Master'
        ) {
          ack({ success: false, error: 'Cannot remove Scrum Master' });
          return;
        }

        room.users.splice(userToRemoveIndex, 1);
        activeSockets.delete(userToRemove.id);

        if (room.currentStory) {
          room.currentStory.votes = room.currentStory.votes.filter(
            (vote) => vote.userId !== userIdToRemove
          );
        }

        await saveRoom(room);

        // Notify the removed user (if connected)
        const removedUserSockets = await io.in(roomId).fetchSockets();
        const removedUserSocket = removedUserSockets.find((s) => s.data.userId === userIdToRemove);
        if (removedUserSocket) {
          removedUserSocket.emit('userRemoved', { reason: 'Removed by Scrum Master' });
          removedUserSocket.leave(roomId);
        }

        io.to(roomId).emit('roomUpdated', room);

        ack({ success: true });
        logger.info('User removed', {
          roomId,
          removedUser: userToRemove?.name,
          by: requestingUser?.name,
        });
      });
    } catch (error) {
      logger.error('Error removing user', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      ack({ success: false, error: 'Failed to remove user' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async (reason) => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;

      // If the client already reconnected on a new socket before this stale
      // socket's disconnect was detected (e.g. ping timeout on a dead link
      // after a fast client-side reconnect), this event is obsolete — acting
      // on it would wrongly mark a live session as disconnected. See:
      // room disappearing while the user's (new) connection was never
      // actually gone.
      if (userId && activeSockets.get(userId) !== socket.id) {
        logger.info('Ignoring stale disconnect (superseded by newer connection)', {
          roomId,
          userId,
          socketId: socket.id,
          reason,
        });
        return;
      }
      if (userId) activeSockets.delete(userId);

      if (roomId && userId) {
        await withRoomLock(roomId, async () => {
          const room = await getRoom(roomId);
          if (!room) return;

          const user = room.users.find((u) => u.id === userId);
          if (!user) return;

          logger.info('User disconnected from room', { roomId, userName: user?.name, reason });

          // Mark user as disconnected but don't remove immediately — the
          // presence sweep decides promotion/removal on its next tick.
          user.isConnected = false;
          user.disconnectedAt = Date.now();

          // If the disconnected user is Scrum Master and someone else is
          // still around, mark them displaced right away; the sweep will
          // promote a Temporary Scrum Master if they don't come back in time.
          if (user.role === 'Scrum Master') {
            const connectedUsers = room.users.filter((u) => u.isConnected && u.id !== userId);
            if (connectedUsers.length > 0) {
              user.role = 'Displaced Scrum Master';
            }
          }

          await saveRoom(room);
          io.to(roomId).emit('roomUpdated', room);
        });
      }

      logger.info('Socket disconnected', { socketId: socket.id, reason });
    } catch (error) {
      logger.error('Error handling disconnect', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }
  });
});

// Handle React Router (SPA) - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
  res.sendFile(path.join(currentDirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
let presenceSweepHandle = null;
let rateLimitCleanupHandle = null;

async function start() {
  try {
    await connectRedis();
  } catch (error) {
    logger.error('Fatal: could not connect to Redis', { message: error?.message });
    process.exit(1);
  }

  // Reclaim any stragglers left 'connected' by a previous process generation
  // before we start accepting sockets or sweeping.
  await reconcileOnStartup();

  presenceSweepHandle = setInterval(runPresenceSweep, PRESENCE_SWEEP_INTERVAL_MS);
  presenceSweepHandle.unref();

  // Evict expired rate-limit buckets so the in-memory map can't grow without
  // bound as new client IPs appear over the process's lifetime.
  rateLimitCleanupHandle = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of apiRateLimits) {
      if (now - entry.start > API_WINDOW_MS) apiRateLimits.delete(key);
    }
  }, API_WINDOW_MS);
  rateLimitCleanupHandle.unref();

  // Without this, a bind failure (e.g. port already in use) only surfaces as
  // an unhandled 'error' event -> uncaughtException, which logs but does not
  // exit — leaving a zombie process holding a Redis connection and running
  // the presence sweep with no HTTP server actually listening.
  server.on('error', (error) => {
    logger.error('Fatal: server failed to start', { message: error?.message });
    process.exit(1);
  });

  server.listen(PORT, () => {
    logger.info('Server running', { port: PORT });
  });
}

// Graceful shutdown: warn connected clients and let sockets close cleanly
// instead of a hard kill that drops everyone with no explanation.
function gracefulShutdown(signal) {
  logger.info('Shutdown signal received', { signal });

  if (presenceSweepHandle) clearInterval(presenceSweepHandle);
  if (rateLimitCleanupHandle) clearInterval(rateLimitCleanupHandle);

  io.emit('serverShuttingDown', {
    message: 'Server is restarting for maintenance. You will be reconnected automatically.',
  });

  server.close(async () => {
    await disconnectRedis();
    logger.info('Server closed');
    process.exit(0);
  });

  // Safety net: force-exit if sockets/requests never drain
  setTimeout(() => {
    logger.warn('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

// Only auto-start (bind a real port, connect to Redis, install signal
// handlers) when this file is run directly (`node server.js`). Tests import
// { app, server, io } and drive the lifecycle themselves, so importing this
// module must not have side effects.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  start();
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export {
  app,
  server,
  io,
  start,
  gracefulShutdown,
  runPresenceSweep,
  reconcileOnStartup,
  activeSockets,
};
