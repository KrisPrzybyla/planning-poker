// Vercel serverless function for Socket.io
const { Server } = require('socket.io');
const { createServer } = require('http');

// Import the main server logic
const setupSocketHandlers = require('../server/dist/socketHandlers');

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.io for Vercel...');
    
    const httpServer = createServer();
    io = new Server(httpServer, {
      path: '/api/socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['polling']
    });

    // Setup socket handlers
    setupSocketHandlers(io);
    
    res.socket.server.io = io;
  }
  
  res.end();
}