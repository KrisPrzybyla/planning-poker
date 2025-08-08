import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memory optimization: Limit Node.js heap size
if (!process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS = '--max-old-space-size=128';
}

const app = express();

// Memory optimization: Minimal middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: false
}));
app.use(express.json({ limit: '1kb' })); // Limit JSON payload

// Memory optimization: Cleanup intervals
const ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const USER_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const MAX_ROOMS = 50; // Limit concurrent rooms
const MAX_USERS_PER_ROOM = 20; // Limit users per room

// Lightweight in-memory storage with automatic cleanup
const rooms = new Map();
const roomActivity = new Map(); // Track last activity per room

// Allowed vote values (Planning Poker)
const ALLOWED_VOTES = new Set(['0', '1', '2', '3', '5', '8', '13', '21', '?', '\u2615']);

// Memory optimization: Minimal room object structure
function createMinimalRoom(id) {
  return {
    id,
    users: [],
    story: null,
    voting: false,
    results: false,
    count: 0,
    lastActivity: Date.now()
  };
}

// Memory optimization: Minimal user object structure
function createMinimalUser(id, name, role, roomId) {
  return {
    id,
    name: name.substring(0, 20), // Limit name length
    role,
    roomId,
    connected: true
  };
}

// Automatic cleanup of inactive rooms
function cleanupInactiveRooms() {
  const now = Date.now();
  const roomsToDelete = [];
  
  for (const [roomId, room] of rooms.entries()) {
    const lastActivity = roomActivity.get(roomId) || room.lastActivity || 0;
    
    // Remove rooms inactive for more than USER_TIMEOUT
    if (now - lastActivity > USER_TIMEOUT) {
      roomsToDelete.push(roomId);
    }
    
    // Remove disconnected users
    room.users = room.users.filter(user => {
      if (!user.connected && user.disconnectedAt) {
        return (now - user.disconnectedAt) < 30000; // 30 seconds grace period
      }
      return true;
    });
    
    // Remove empty rooms
    if (room.users.length === 0) {
      roomsToDelete.push(roomId);
    }
  }
  
  // Clean up rooms
  roomsToDelete.forEach(roomId => {
    rooms.delete(roomId);
    roomActivity.delete(roomId);
    console.log(`Cleaned up inactive room: ${roomId}`);
  });
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}

// Start cleanup interval
setInterval(cleanupInactiveRooms, ROOM_CLEANUP_INTERVAL);

// Update room activity
function updateRoomActivity(roomId) {
  roomActivity.set(roomId, Date.now());
}

// Health check endpoint (minimal)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
  });
});

// Stats endpoint (minimal)
app.get('/api/stats', (req, res) => {
  res.json({
    rooms: rooms.size,
    users: Array.from(rooms.values()).reduce((sum, room) => sum + room.users.length, 0)
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: false
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST'],
  },
  // Memory optimization: Socket.IO settings
  pingTimeout: 20000,
  pingInterval: 10000,
  maxHttpBufferSize: 1e3, // 1KB max message size
  transports: ['websocket', 'polling']
});

// Generate room code (optimized)
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create unique room code with limit check
function createUniqueRoomCode() {
  // Check room limit
  if (rooms.size >= MAX_ROOMS) {
    throw new Error('Server at capacity');
  }
  
  let code;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > 10) throw new Error('Failed to generate unique code');
  } while (rooms.has(code));
  return code;
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id.substring(0, 8));

  // Create room (optimized)
  socket.on('createRoom', ({ userName, initialStory }, callback) => {
    try {
      const roomId = createUniqueRoomCode();
      const userId = uuidv4();
      
      const user = createMinimalUser(userId, userName, 'Scrum Master', roomId);
      const room = createMinimalRoom(roomId);
      room.users.push(user);
      
      rooms.set(roomId, room);
      updateRoomActivity(roomId);
      
      socket.join(roomId);
      socket.data = { userId, roomId };
      
      callback({ success: true, roomId, user });
      io.to(roomId).emit('roomUpdated', room);
      
      // Handle initial story
      if (initialStory?.title) {
        room.count++;
        room.story = {
          id: uuidv4(),
          title: initialStory.title.substring(0, 100),
          description: (initialStory.description || '').substring(0, 500),
          votes: []
        };
        room.voting = true;
        room.results = false;
        
        io.to(roomId).emit('roomUpdated', room);
      }
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Join room (optimized)
  socket.on('joinRoom', ({ roomId, userName }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      if (room.users.length >= MAX_USERS_PER_ROOM) {
        callback({ success: false, error: 'Room full' });
        return;
      }
      
      const userId = uuidv4();
      const user = createMinimalUser(userId, userName, 'Participant', roomId);
      room.users.push(user);
      
      updateRoomActivity(roomId);
      
      socket.join(roomId);
      socket.data = { userId, roomId };
      
      callback({ success: true, user });
      io.to(roomId).emit('roomUpdated', room);
    } catch (error) {
      callback({ success: false, error: 'Join failed' });
    }
  });

  // Rejoin room (optimized)
  socket.on('rejoinRoom', ({ roomId, userId }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      const user = room.users.find(u => u.id === userId);
      if (!user) {
        callback({ success: false, error: 'User not found' });
        return;
      }
      
      user.connected = true;
      delete user.disconnectedAt;
      updateRoomActivity(roomId);
      
      socket.join(roomId);
      socket.data = { userId, roomId };
      
      callback({ success: true, user });
      io.to(roomId).emit('roomUpdated', room);
    } catch (error) {
      callback({ success: false, error: 'Rejoin failed' });
    }
  });

  // Start voting (optimized)
  socket.on('startVoting', ({ roomId, story }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      const user = room.users.find(u => u.id === socket.data.userId);
      if (!user || user.role !== 'Scrum Master') {
        callback({ success: false, error: 'Unauthorized' });
        return;
      }
      
      room.count++;
      room.story = {
        id: uuidv4(),
        title: (story.title || `Voting #${room.count}`).substring(0, 100),
        description: (story.description || '').substring(0, 500),
        votes: []
      };
      room.voting = true;
      room.results = false;
      
      updateRoomActivity(roomId);
      
      callback({ success: true });
      io.to(roomId).emit('roomUpdated', room);
    } catch (error) {
      callback({ success: false, error: 'Start voting failed' });
    }
  });

  // Submit vote (optimized)
  socket.on('submitVote', ({ roomId, vote }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.voting) {
        callback({ success: false, error: 'Voting not active' });
        return;
      }
      
      const user = room.users.find(u => u.id === socket.data.userId);
      if (!user) {
        callback({ success: false, error: 'User not found' });
        return;
      }
      
      // Remove existing vote
      room.story.votes = room.story.votes.filter(v => v.userId !== user.id);
      
      // Validate vote value
      const voteStr = String(vote);
      if (!ALLOWED_VOTES.has(voteStr)) {
        callback({ success: false, error: 'Invalid vote value' });
        return;
      }

      // Add new vote
      room.story.votes.push({
        userId: user.id,
        userName: user.name,
        vote: voteStr
      });
      
      updateRoomActivity(roomId);
      
      callback({ success: true });
      io.to(roomId).emit('roomUpdated', room);
    } catch (error) {
      callback({ success: false, error: 'Vote failed' });
    }
  });

  // End voting (optimized)
  socket.on('endVoting', ({ roomId }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      const user = room.users.find(u => u.id === socket.data.userId);
      if (!user || user.role !== 'Scrum Master') {
        callback({ success: false, error: 'Unauthorized' });
        return;
      }
      
      room.voting = false;
      room.results = true;
      
      updateRoomActivity(roomId);
      
      callback({ success: true });
      io.to(roomId).emit('roomUpdated', room);
    } catch (error) {
      callback({ success: false, error: 'End voting failed' });
    }
  });

  // Clear voting (optimized)
  socket.on('clearVoting', ({ roomId }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      const user = room.users.find(u => u.id === socket.data.userId);
      if (!user || user.role !== 'Scrum Master') {
        callback({ success: false, error: 'Unauthorized' });
        return;
      }
      
      room.story = null;
      room.voting = false;
      room.results = false;
      
      updateRoomActivity(roomId);
      
      callback({ success: true });
      io.to(roomId).emit('roomUpdated', room);
    } catch (error) {
      callback({ success: false, error: 'Clear failed' });
    }
  });

  // Handle disconnect (optimized)
  socket.on('disconnect', () => {
    const { userId, roomId } = socket.data || {};
    if (!userId || !roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const user = room.users.find(u => u.id === userId);
    if (user) {
      user.connected = false;
      user.disconnectedAt = Date.now();
      
      // Simplified role management
      if (user.role === 'Scrum Master') {
        const activeUsers = room.users.filter(u => u.connected && u.id !== userId);
        if (activeUsers.length > 0) {
          activeUsers[0].role = 'Scrum Master';
          user.role = 'Displaced Scrum Master';
        }
      }
      
      updateRoomActivity(roomId);
      io.to(roomId).emit('roomUpdated', room);
    }
  });
});

// Catch all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Optimized server running on port ${PORT}`);
  console.log(`Memory limit: ${process.env.NODE_OPTIONS || 'default'}`);
  console.log(`Max rooms: ${MAX_ROOMS}, Max users per room: ${MAX_USERS_PER_ROOM}`);
});