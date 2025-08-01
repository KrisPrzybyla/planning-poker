import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Room, 
  User, 
  Vote, 
  FibonacciCard, 
  RoomStats,
  ServerToClientEvents,
  ClientToServerEvents
} from '../shared/types';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? true // Allow all origins for Vercel
      : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

// In-memory storage (w produkcji użyj bazy danych)
const rooms = new Map<string, Room>();
const userRooms = new Map<string, string>(); // userId -> roomId

// Utility functions
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateStats(votes: Vote[]): RoomStats {
  const validVotes = votes.filter(v => v.card && v.card !== '?' && v.card !== '☕');
  const numericVotes = validVotes
    .map(v => parseInt(v.card as string))
    .filter(n => !isNaN(n));
  
  const totalVotes = votes.length;
  const averagePoints = numericVotes.length > 0 
    ? numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length 
    : 0;
  
  // Sprawdź consensus (wszystkie głosy takie same)
  const uniqueVotes = new Set(votes.map(v => v.card));
  const consensus = uniqueVotes.size <= 1;
  
  // Najczęstszy głos
  const voteCount = new Map<FibonacciCard, number>();
  votes.forEach(v => {
    if (v.card) {
      voteCount.set(v.card, (voteCount.get(v.card) || 0) + 1);
    }
  });
  
  let mostCommonVote: FibonacciCard | null = null;
  let maxCount = 0;
  voteCount.forEach((count, card) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonVote = card;
    }
  });
  
  return {
    totalVotes,
    averagePoints,
    consensus,
    mostCommonVote
  };
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('create-room', (roomName: string, userName: string) => {
    const roomId = generateRoomId();
    const user: User = {
      id: socket.id,
      name: userName,
      role: 'scrum-master',
      isConnected: true
    };
    
    const room: Room = {
      id: roomId,
      name: roomName,
      scrumMasterId: socket.id,
      users: [user],
      currentStory: '',
      votes: [],
      isVotingActive: false,
      isRevealed: false,
      createdAt: Date.now()
    };
    
    rooms.set(roomId, room);
    userRooms.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room-updated', room);
    console.log(`Room created: ${roomId} by ${userName}`);
  });
  
  socket.on('join-room', (roomId: string, userName: string) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Pokój nie istnieje');
      return;
    }
    
    // Sprawdź czy użytkownik już jest w pokoju
    const existingUser = room.users.find(u => u.id === socket.id);
    if (existingUser) {
      existingUser.isConnected = true;
      socket.join(roomId);
      userRooms.set(socket.id, roomId);
      socket.emit('room-updated', room);
      socket.to(roomId).emit('user-joined', existingUser);
      return;
    }
    
    const user: User = {
      id: socket.id,
      name: userName,
      role: 'participant',
      isConnected: true
    };
    
    room.users.push(user);
    userRooms.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room-updated', room);
    socket.to(roomId).emit('user-joined', user);
    console.log(`User ${userName} joined room ${roomId}`);
  });
  
  socket.on('start-voting', (story: string) => {
    const roomId = userRooms.get(socket.id);
    const room = rooms.get(roomId || '');
    
    if (!room || room.scrumMasterId !== socket.id) {
      socket.emit('error', 'Tylko Scrum Master może rozpocząć głosowanie');
      return;
    }
    
    room.currentStory = story;
    room.isVotingActive = true;
    room.isRevealed = false;
    room.votes = [];
    
    io.to(roomId!).emit('voting-started', story);
    io.to(roomId!).emit('room-updated', room);
  });
  
  socket.on('cast-vote', (card: FibonacciCard) => {
    const roomId = userRooms.get(socket.id);
    const room = rooms.get(roomId || '');
    
    if (!room || !room.isVotingActive) {
      socket.emit('error', 'Głosowanie nie jest aktywne');
      return;
    }
    
    // Usuń poprzedni głos użytkownika
    room.votes = room.votes.filter(v => v.userId !== socket.id);
    
    // Dodaj nowy głos
    room.votes.push({
      userId: socket.id,
      card,
      timestamp: Date.now()
    });
    
    io.to(roomId!).emit('room-updated', room);
  });
  
  socket.on('reveal-votes', () => {
    const roomId = userRooms.get(socket.id);
    const room = rooms.get(roomId || '');
    
    if (!room || room.scrumMasterId !== socket.id) {
      socket.emit('error', 'Tylko Scrum Master może ujawnić głosy');
      return;
    }
    
    room.isRevealed = true;
    const stats = calculateStats(room.votes);
    
    io.to(roomId!).emit('votes-revealed', stats);
    io.to(roomId!).emit('room-updated', room);
  });
  
  socket.on('reset-votes', () => {
    const roomId = userRooms.get(socket.id);
    const room = rooms.get(roomId || '');
    
    if (!room || room.scrumMasterId !== socket.id) {
      socket.emit('error', 'Tylko Scrum Master może zresetować głosy');
      return;
    }
    
    room.votes = [];
    room.isRevealed = false;
    
    io.to(roomId!).emit('votes-reset');
    io.to(roomId!).emit('room-updated', room);
  });
  
  socket.on('end-voting', () => {
    const roomId = userRooms.get(socket.id);
    const room = rooms.get(roomId || '');
    
    if (!room || room.scrumMasterId !== socket.id) {
      socket.emit('error', 'Tylko Scrum Master może zakończyć głosowanie');
      return;
    }
    
    room.isVotingActive = false;
    room.isRevealed = false;
    room.currentStory = '';
    room.votes = [];
    
    io.to(roomId!).emit('voting-ended');
    io.to(roomId!).emit('room-updated', room);
  });
  
  socket.on('disconnect', () => {
    const roomId = userRooms.get(socket.id);
    const room = rooms.get(roomId || '');
    
    if (room) {
      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        user.isConnected = false;
        socket.to(roomId!).emit('user-left', socket.id);
        socket.to(roomId!).emit('room-updated', room);
      }
    }
    
    userRooms.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', rooms: rooms.size });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Planning Poker server running on port ${PORT}`);
});