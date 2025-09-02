import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// Import MySQL configuration if enabled
let DatabaseService = null;
const USE_DATABASE = process.env.DB_ENABLED === 'true';

if (USE_DATABASE) {
  try {
    const dbModule = await import('./mysql-config.example.js');
    DatabaseService = dbModule.DatabaseService;
    console.log('🗄️ MySQL mode enabled');
  } catch (error) {
    console.error('❌ Failed to load MySQL configuration:', error);
    console.log('📝 Falling back to in-memory storage');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Storage abstraction layer
class StorageService {
  constructor() {
    this.useDatabase = USE_DATABASE && DatabaseService;
    this.memoryRooms = new Map(); // Fallback storage
    
    if (this.useDatabase) {
      console.log('✅ Using MySQL database storage');
    } else {
      console.log('📝 Using in-memory storage');
    }
  }

  async initialize() {
    if (this.useDatabase) {
      return await DatabaseService.initialize();
    }
    return true;
  }

  // Room operations
  async createRoom(roomData) {
    if (this.useDatabase) {
      return await DatabaseService.createRoom(roomData);
    } else {
      this.memoryRooms.set(roomData.id, roomData);
      return roomData;
    }
  }

  async getRoom(roomId) {
    if (this.useDatabase) {
      return await DatabaseService.getRoomWithUsers(roomId);
    } else {
      return this.memoryRooms.get(roomId) || null;
    }
  }

  async updateRoom(roomId, updates) {
    if (this.useDatabase) {
      await DatabaseService.updateRoom(roomId, updates);
      return await this.getRoom(roomId);
    } else {
      const room = this.memoryRooms.get(roomId);
      if (room) {
        Object.assign(room, updates);
        return room;
      }
      return null;
    }
  }

  async deleteRoom(roomId) {
    if (this.useDatabase) {
      return await DatabaseService.deleteRoom(roomId);
    } else {
      return this.memoryRooms.delete(roomId);
    }
  }

  async roomExists(roomId) {
    if (this.useDatabase) {
      const room = await DatabaseService.getRoomWithUsers(roomId);
      return !!room;
    } else {
      return this.memoryRooms.has(roomId);
    }
  }

  // User operations
  async addUserToRoom(roomId, userData) {
    if (this.useDatabase) {
      await DatabaseService.createUser(userData);
      return await this.getRoom(roomId);
    } else {
      const room = this.memoryRooms.get(roomId);
      if (room) {
        room.users.push(userData);
        return room;
      }
      return null;
    }
  }

  async updateUser(userId, updates) {
    if (this.useDatabase) {
      // Implementation depends on specific update type
      if ('isConnected' in updates) {
        return await DatabaseService.updateUserConnection(userId, updates.isConnected);
      }
    } else {
      // Find user in memory and update
      for (const room of this.memoryRooms.values()) {
        const user = room.users.find(u => u.id === userId);
        if (user) {
          Object.assign(user, updates);
          return user;
        }
      }
    }
    return null;
  }

  async removeUser(userId) {
    if (this.useDatabase) {
      return await DatabaseService.removeUser(userId);
    } else {
      for (const room of this.memoryRooms.values()) {
        const userIndex = room.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          room.users.splice(userIndex, 1);
          return true;
        }
      }
      return false;
    }
  }

  // Statistics
  async getStats() {
    if (this.useDatabase) {
      return await DatabaseService.getGlobalStatistics();
    } else {
      const totalRooms = this.memoryRooms.size;
      let totalUsers = 0;
      let connectedUsers = 0;
      
      for (const room of this.memoryRooms.values()) {
        totalUsers += room.users.length;
        connectedUsers += room.users.filter(u => u.isConnected).length;
      }

      return {
        totalRooms,
        totalUsers,
        connectedUsers,
        totalStories: 0, // Not tracked in memory version
        totalVotes: 0    // Not tracked in memory version
      };
    }
  }
}

// Initialize storage service
const storage = new StorageService();

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const stats = await storage.getStats();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    storage: storage.useDatabase ? 'mysql' : 'memory',
    services: {
      database: storage.useDatabase ? 'mysql' : 'memory',
      socketio: 'active',
      express: 'active'
    },
    stats
  };

  res.status(200).json(healthStatus);
});

// API endpoint to get server stats
app.get('/api/stats', async (req, res) => {
  const stats = await storage.getStats();
  res.status(200).json(stats);
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Generate a random 6-character room code
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Create a unique room code
async function createUniqueRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > 100) {
      throw new Error('Unable to generate unique room code');
    }
  } while (await storage.roomExists(code));
  return code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('createRoom', async ({ userName, initialStory }, callback) => {
    try {
      const roomId = await createUniqueRoomCode();
      const userId = uuidv4();

      // Create user object
      const user = {
        id: userId,
        name: userName,
        role: 'Scrum Master',
        roomId,
        isConnected: true,
      };

      // Create room object
      const roomData = {
        id: roomId,
        users: [user],
        currentStory: null,
        isVotingActive: false,
        isResultsVisible: false,
        votingCount: 0,
      };

      // Store room
      const room = await storage.createRoom(roomData);

      // Join socket to room
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Send success response
      callback({ success: true, roomId, user });

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      console.log(`Room created: ${roomId} by ${userName} (${storage.useDatabase ? 'MySQL' : 'Memory'})`);
      
      // Handle initial story if provided
      if (initialStory) {
        const updatedRoom = await storage.updateRoom(roomId, {
          votingCount: 1,
          currentStory: {
            id: uuidv4(),
            title: initialStory.title.trim() || 'Voting #1',
            description: initialStory.description || '',
            votes: [],
          },
          isVotingActive: true,
          isResultsVisible: false
        });

        io.to(roomId).emit('roomUpdated', updatedRoom);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on('joinRoom', async ({ roomId, userName }, callback) => {
    try {
      if (!(await storage.roomExists(roomId))) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const userId = uuidv4();
      const user = {
        id: userId,
        name: userName,
        role: 'Participant',
        roomId,
        isConnected: true,
      };

      const room = await storage.addUserToRoom(roomId, user);

      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      callback({ success: true, user });
      io.to(roomId).emit('roomUpdated', room);

      console.log(`User ${userName} joined room: ${roomId} (${storage.useDatabase ? 'MySQL' : 'Memory'})`);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;

      if (userId && roomId) {
        await storage.updateUser(userId, { 
          isConnected: false,
          disconnectedAt: new Date()
        });

        const room = await storage.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('roomUpdated', room);
        }

        console.log(`User disconnected: ${socket.id} (${storage.useDatabase ? 'MySQL' : 'Memory'})`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Handle React Router (SPA) - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and start server
async function startServer() {
  try {
    await storage.initialize();
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Storage: ${storage.useDatabase ? 'MySQL Database' : 'In-Memory'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();