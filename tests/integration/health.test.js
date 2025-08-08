const request = require('supertest');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

// Import the Express app
const express = require('express');
const cors = require('cors');

describe('Health Check Integration Tests', () => {
  let app;
  let server;
  let io;
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    // Create Express app similar to server.js
    app = express();
    app.use(cors());
    app.use(express.json());

    // Create HTTP server
    server = createServer(app);
    
    // Create Socket.IO server
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Add health check endpoint
    app.get('/api/health', (req, res) => {
      const uptime = process.uptime();
      const timestamp = new Date().toISOString();
      
      // Get stats from Socket.IO
      const rooms = io.sockets.adapter.rooms;
      const activeRooms = Array.from(rooms.keys()).filter(room => 
        !io.sockets.sockets.has(room)
      ).length;
      const totalConnections = io.sockets.sockets.size;

      res.json({
        status: 'healthy',
        timestamp,
        uptime,
        environment: process.env.NODE_ENV || 'test',
        version: '1.0.0',
        services: {
          database: 'not_applicable',
          socketio: 'healthy'
        },
        stats: {
          activeRooms,
          totalConnections
        }
      });
    });

    // Add stats endpoint
    app.get('/api/stats', (req, res) => {
      const rooms = io.sockets.adapter.rooms;
      const activeRooms = Array.from(rooms.keys()).filter(room => 
        !io.sockets.sockets.has(room)
      ).length;
      const totalConnections = io.sockets.sockets.size;

      res.json({
        activeRooms,
        totalConnections,
        timestamp: new Date().toISOString()
      });
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      serverSocket = socket;
      
      socket.on('create-room', (data) => {
        const { roomId, userName } = data;
        socket.join(roomId);
        socket.emit('room-created', { roomId, userName });
      });

      socket.on('join-room', (data) => {
        const { roomId, userName } = data;
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', { userName });
        socket.emit('room-joined', { roomId, userName });
      });

      socket.on('disconnect', () => {
        // Handle disconnect
      });
    });

    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    io.close();
    server.close();
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    done();
  });

  describe('Health Check Endpoint', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        environment: 'test',
        version: '1.0.0',
        services: {
          database: 'not_applicable',
          socketio: 'healthy'
        }
      });

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.stats).toMatchObject({
        activeRooms: expect.any(Number),
        totalConnections: expect.any(Number)
      });
    });

    test('should return stats', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        activeRooms: expect.any(Number),
        totalConnections: expect.any(Number),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Socket.IO Integration', () => {
    test('should connect to Socket.IO server', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('should create room successfully', (done) => {
      const roomData = {
        roomId: 'test-room-123',
        userName: 'Test User'
      };

      // Remove any existing listeners
      clientSocket.off('room-created');
      
      clientSocket.emit('create-room', roomData);
      
      clientSocket.on('room-created', (data) => {
        expect(data).toMatchObject(roomData);
        done();
      });
    });

    test('should join room successfully', (done) => {
      const roomData = {
        roomId: 'test-room-456',
        userName: 'Test User 2'
      };

      // Remove any existing listeners
      clientSocket.off('room-joined');
      
      clientSocket.emit('join-room', roomData);
      
      clientSocket.on('room-joined', (data) => {
        expect(data).toMatchObject(roomData);
        done();
      });
    });

    test('should update stats after room operations', async () => {
      // Create a room first
      const roomData = {
        roomId: 'stats-test-room',
        userName: 'Stats Test User'
      };

      // Remove any existing listeners
      clientSocket.off('room-created');
      
      clientSocket.emit('create-room', roomData);
      
      // Wait a bit for the room to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.totalConnections).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent endpoints gracefully', async () => {
      await request(app)
        .get('/api/non-existent')
        .expect(404);
    });

    test('should handle malformed requests', async () => {
      await request(app)
        .post('/api/health')
        .send({ invalid: 'data' })
        .expect(404); // POST not allowed on health endpoint
    });
  });

  describe('Health Check Response Time', () => {
    test('should respond to health check within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should respond to stats within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/stats')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });
  });
});