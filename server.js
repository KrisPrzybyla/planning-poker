import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? (process.env.CORS_ORIGIN || false) : '*',
  credentials: false
}));
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

    // Loguj tylko kiedy:
    // - errorsOnly = true i status >= 400, lub
    // - errorsOnly = false i (sampling przepuścił) oraz (jeśli ustawiono próg slowMs, to duration >= slowMs)
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
      userAgent: req.headers['user-agent']
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
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'memory', // Since we're using in-memory storage
      socketio: 'active',
      express: 'active'
    },
    stats: {
      activeRooms: rooms.size,
      totalConnections: io.engine.clientsCount
    }
  };

  res.status(200).json(healthStatus);
});

// API endpoint to get server stats
app.get('/api/stats', (req, res) => {
  const stats = {
    activeRooms: rooms.size,
    totalConnections: io.engine.clientsCount,
    rooms: Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      userCount: room.users.length,
      isVotingActive: room.isVotingActive,
      hasStory: !!room.currentStory
    }))
  };

  res.status(200).json(stats);
});

// Serve static files from the dist directory with cache headers optimized for Cloudflare
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    const rel = filePath.replace(path.join(__dirname, 'dist'), '');
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
  }
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? (process.env.CORS_ORIGIN || false) : '*',
    methods: ['GET', 'POST'],
  },
});

// Store rooms in memory (in a real app, you'd use a database)
const rooms = new Map();

// Allowed vote values (Planning Poker)
const ALLOWED_VOTES = new Set(['0', '1', '2', '3', '5', '8', '13', '21', '?', '\u2615']);

// Generate a random 6-character room code
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Check if room code is unique
function isRoomCodeUnique(code) {
  return !rooms.has(code);
}

// Create a new room code
function createUniqueRoomCode() {
  let code;
  do {
    code = generateRoomCode();
  } while (!isRoomCodeUnique(code));
  return code;
}

io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });

  // Create a new room
  socket.on('createRoom', ({ userName, initialStory }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    callback = ack;

    try {
      const roomId = createUniqueRoomCode();
      const userId = uuidv4();

      // Create user object
      const user = {
        id: userId,
        name: userName,
        role: 'Scrum Master', // Creator is always Scrum Master
        roomId,
        isConnected: true,
      };

      // Create room object
      const room = {
        id: roomId,
        users: [user],
        currentStory: null,
        isVotingActive: false,
        isResultsVisible: false,
        votingCount: 0, // Counter for auto-naming votings
      };

      // Store room in memory
      rooms.set(roomId, room);

      // Join socket to room
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Send success response
      ack({ success: true, roomId, user });

      // Broadcast room update to all users in the room
      io.to(roomId).emit('roomUpdated', room);

      logger.info('Room created', { roomId, userName });
      
      // If initialStory is provided, start voting immediately
      if (initialStory) {
        // Increment voting count
        room.votingCount = (room.votingCount || 0) + 1;
        
        // If title is empty, generate a default title
        const storyTitle = initialStory.title.trim() ? initialStory.title : `Voting #${room.votingCount}`;

        // Create new story with unique ID
        const newStory = {
          id: uuidv4(),
          title: storyTitle,
          description: initialStory.description || '',
          votes: [],
        };

        // Update room
        room.currentStory = newStory;
        room.isVotingActive = true;
        room.isResultsVisible = false;

        // Broadcast room update
        io.to(roomId).emit('roomUpdated', room);

        logger.info('Voting started', { roomId, storyTitle });
      }
    } catch (error) {
      logger.error('Error creating room', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
      ack({ success: false, error: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomId, userName }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    callback = ack;

    try {
      // Check if room exists
      if (!rooms.has(roomId)) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const room = rooms.get(roomId);
      const userId = uuidv4();

      // Create user object
      const user = {
        id: userId,
        name: userName,
        role: 'Participant', // Joiners are always Participants
        roomId,
        isConnected: true,
      };

      // Add user to room
      room.users.push(user);

      // Join socket to room
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Send success response
      callback({ success: true, user });

      // Broadcast room update to all users in the room
      io.to(roomId).emit('roomUpdated', room);

      logger.info('User joined room', { roomId, userName });
    } catch (error) {
      logger.error('Error joining room', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Rejoin an existing room (for page refresh)
  socket.on('rejoinRoom', ({ roomId, userId }, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    callback = ack;

    try {
      // Check if room exists
      if (!rooms.has(roomId)) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const room = rooms.get(roomId);

      // Check if user exists in room
      const user = room.users.find((u) => u.id === userId);
      if (!user) {
        callback({ success: false, error: 'User not found in room' });
        return;
      }

      // Mark user as connected
      user.isConnected = true;
      delete user.disconnectedAt;

      // If rejoining user is displaced Scrum Master, restore their role
      if (user.role === 'Displaced Scrum Master') {
        // Find current temporary SM and demote them
        const tempSM = room.users.find(u => u.role === 'Temporary Scrum Master');
        if (tempSM) {
          tempSM.role = 'Participant';
          console.log(`User ${tempSM.name} demoted from Temporary Scrum Master to Participant in room ${roomId}`);
        }
        
        // Restore original SM
        user.role = 'Scrum Master';
        console.log(`User ${user.name} restored as Scrum Master in room ${roomId}`);
        
        // Send notification about SM restoration
        io.to(roomId).emit('scrumMasterChanged', {
          newScrumMaster: user,
          reason: 'original_reconnected',
          previousTempScrumMaster: tempSM
        });
      }

      // Join socket to room
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Send success response
      callback({ success: true, user });

      // Broadcast room update to all users in the room
      io.to(roomId).emit('roomUpdated', room);

      logger.info('User rejoined room', { roomId, userName: user?.name });
    } catch (error) {
      logger.error('Error rejoining room', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
      callback({ success: false, error: 'Failed to rejoin room' });
    }
  });

  // Start voting on a story
  socket.on('startVoting', ({ roomId, story }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const userId = socket.data.userId;

      // Check if user is Scrum Master or Temporary Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master')) return;

      // Increment voting count
      room.votingCount = (room.votingCount || 0) + 1;
      
      // If title is empty, generate a default title
      const storyTitle = story.title.trim() ? story.title : `Voting #${room.votingCount}`;

      // Create new story with unique ID
      const newStory = {
        id: uuidv4(),
        title: storyTitle,
        description: story.description || '',
        votes: [],
      };

      // Update room
      room.currentStory = newStory;
      room.isVotingActive = true;
      room.isResultsVisible = false;

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      logger.info('Voting started', { roomId, storyTitle });
    } catch (error) {
      logger.error('Error starting voting', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
    }
  });

  // Submit a vote
  socket.on('submitVote', ({ roomId, userId, value }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);

      // Check if voting is active and story exists
      if (!room.isVotingActive || !room.currentStory) return;

      // Check if user exists in room
      const userExists = room.users.some((u) => u.id === userId);
      if (!userExists) return;

      // Remove any existing vote by this user
      room.currentStory.votes = room.currentStory.votes.filter((v) => v.userId !== userId);

      // Validate vote value
      const valueStr = String(value);
      if (!ALLOWED_VOTES.has(valueStr)) {
        logger.warn('Rejected invalid vote value', { roomId, userId, value: valueStr });
        return;
      }

      // Add new vote
      room.currentStory.votes.push({ userId, value: valueStr });

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      logger.info('Vote submitted', { roomId, userId, value: valueStr });
    } catch (error) {
      logger.error('Error submitting vote', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
    }
  });

  // Reveal voting results
  socket.on('revealResults', ({ roomId }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const userId = socket.data.userId;

      // Check if user is Scrum Master or Temporary Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master')) return;

      // Update room
      room.isResultsVisible = true;

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      logger.info('Results revealed', { roomId });
    } catch (error) {
      logger.error('Error revealing results', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
    }
  });

  // Reset voting
  socket.on('resetVoting', ({ roomId }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const userId = socket.data.userId;

      // Check if user is Scrum Master or Temporary Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master')) return;

      // Clear votes if there's a current story
      if (room.currentStory) {
        room.currentStory.votes = [];
      }

      // Reset voting state
      room.isVotingActive = true;
      room.isResultsVisible = false;

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      logger.info('Voting reset', { roomId });
    } catch (error) {
      logger.error('Error resetting voting', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
    }
  });

  // End session
  socket.on('endSession', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find(u => u.id === socket.data.userId);
    if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master')) return;

    io.to(roomId).emit('sessionEnded');
    rooms.delete(roomId);
    logger.info('Session ended', { roomId });
  });

  // Remove user from room (only Scrum Master can do this)
  socket.on('removeUser', async ({ roomId, userIdToRemove }, callback) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const room = rooms.get(roomId);
      const requestingUserId = socket.data.userId;

      // Check if requesting user is Scrum Master or Temporary Scrum Master
      const requestingUser = room.users.find((u) => u.id === requestingUserId);
      if (!requestingUser || (requestingUser.role !== 'Scrum Master' && requestingUser.role !== 'Temporary Scrum Master')) {
        callback({ success: false, error: 'Only Scrum Master can remove users' });
        return;
      }

      // Find user to remove
      const userToRemoveIndex = room.users.findIndex((u) => u.id === userIdToRemove);
      if (userToRemoveIndex === -1) {
        callback({ success: false, error: 'User not found' });
        return;
      }

      const userToRemove = room.users[userToRemoveIndex];

      // Prevent removing Scrum Master (including self)
      if (userToRemove.role === 'Scrum Master' || userToRemove.role === 'Temporary Scrum Master') {
        callback({ success: false, error: 'Cannot remove Scrum Master' });
        return;
      }

      // Remove user from room
      room.users.splice(userToRemoveIndex, 1);

      // Remove user's votes if any
      if (room.currentStory) {
        room.currentStory.votes = room.currentStory.votes.filter(vote => vote.userId !== userIdToRemove);
      }

      // Notify the removed user (if connected)
      const removedUserSockets = await io.in(roomId).fetchSockets();
      const removedUserSocket = removedUserSockets.find(s => s.data.userId === userIdToRemove);
      if (removedUserSocket) {
        removedUserSocket.emit('userRemoved', { reason: 'Removed by Scrum Master' });
        removedUserSocket.leave(roomId);
      }

      // Broadcast room update to remaining users
      io.to(roomId).emit('roomUpdated', room);

      callback({ success: true });
      logger.info('User removed', { roomId, removedUser: userToRemove?.name, by: requestingUser?.name });
    } catch (error) {
      logger.error('Error removing user', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
      callback({ success: false, error: 'Failed to remove user' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;

      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);

        // Find user in room
        const userIndex = room.users.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
          const user = room.users[userIndex];
          logger.info('User disconnected from room', { roomId, userName: user?.name });

          // Mark user as disconnected but don't remove immediately
          user.isConnected = false;
          user.disconnectedAt = Date.now();

          // If disconnected user is Scrum Master, promote temporary SM after 2 seconds
          if (user.role === 'Scrum Master') {
            // Find the oldest connected participant to promote
            const connectedUsers = room.users.filter(u => u.isConnected && u.id !== userId);
            if (connectedUsers.length > 0) {
              // Mark original SM as temporarily displaced
              user.role = 'Displaced Scrum Master';
              
              // Wait 2 seconds before promoting temporary SM
              setTimeout(() => {
                // Check if room still exists and user is still disconnected
                if (rooms.has(roomId)) {
                  const currentRoom = rooms.get(roomId);
                  const currentUser = currentRoom.users.find(u => u.id === userId);
                  
                  // Only promote if original SM is still disconnected
                  if (currentUser && !currentUser.isConnected && currentUser.role === 'Displaced Scrum Master') {
                    // Find first connected user to promote (re-check in case users changed)
                    const currentConnectedUsers = currentRoom.users.filter(u => u.isConnected && u.id !== userId);
                    if (currentConnectedUsers.length > 0) {
                      // Promote first connected user to temporary SM
                      currentConnectedUsers[0].role = 'Temporary Scrum Master';
                      
                      logger.info('Temporary Scrum Master promoted', { roomId, userName: currentConnectedUsers?.[0]?.name });
                      
                      // Send notification about SM change
                      io.to(roomId).emit('scrumMasterChanged', {
                        newScrumMaster: currentConnectedUsers[0],
                        reason: 'original_disconnected',
                        originalScrumMaster: currentUser
                      });
                      
                      // Broadcast room update
                      io.to(roomId).emit('roomUpdated', currentRoom);
                    }
                  }
                }
              }, 2000); // 2 seconds delay
            }
          }

          // Broadcast room update to show user as disconnected
          io.to(roomId).emit('roomUpdated', room);

          // Set timeout to remove user after 30 seconds if they don't rejoin
          setTimeout(() => {
            if (rooms.has(roomId)) {
              const currentRoom = rooms.get(roomId);
              const currentUserIndex = currentRoom.users.findIndex((u) => u.id === userId);
              
              if (currentUserIndex !== -1) {
                const currentUser = currentRoom.users[currentUserIndex];
                
                // Only remove if still disconnected and enough time has passed
                if (!currentUser.isConnected && (Date.now() - currentUser.disconnectedAt) >= 30000) {
                  logger.info('User removed after timeout', { roomId, userName: currentUser?.name });
                  
                  // Remove user from room
                  currentRoom.users.splice(currentUserIndex, 1);

                  // If room is empty, remove it
                  if (currentRoom.users.length === 0) {
                    rooms.delete(roomId);
                    logger.info('Room removed (empty)', { roomId });
                  } else {
                    // If any type of Scrum Master left permanently, promote first user to Scrum Master
                    if ((currentUser.role === 'Scrum Master' || currentUser.role === 'Displaced Scrum Master' || currentUser.role === 'Temporary Scrum Master') && currentRoom.users.length > 0) {
                      // Find first connected user to promote
                      const connectedUser = currentRoom.users.find(u => u.isConnected);
                      if (connectedUser) {
                        connectedUser.role = 'Scrum Master';
                        logger.info('Scrum Master promoted (permanent)', { roomId, userName: connectedUser?.name });
                        
                        // Send notification about permanent SM change
                        io.to(roomId).emit('scrumMasterChanged', {
                          newScrumMaster: connectedUser,
                          reason: 'permanent_promotion',
                          removedUser: currentUser
                        });
                      }
                    }

                    // Broadcast room update
                    io.to(roomId).emit('roomUpdated', currentRoom);
                  }
                }
              }
            }
          }, 30000); // 30 seconds timeout
        }
      }

      logger.info('Socket disconnected', { socketId: socket.id });
    } catch (error) {
      logger.error('Error handling disconnect', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
    }
  });
});

// Handle React Router (SPA) - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info('Server running', { port: PORT });
});