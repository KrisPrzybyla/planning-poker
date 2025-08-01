"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? [process.env.FRONTEND_URL || "https://planning-poker.vercel.app", "https://localhost:3000"]
            : ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// In-memory storage (w produkcji użyj bazy danych)
const rooms = new Map();
const userRooms = new Map(); // userId -> roomId
// Utility functions
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function calculateStats(votes) {
    const validVotes = votes.filter(v => v.card && v.card !== '?' && v.card !== '☕');
    const numericVotes = validVotes
        .map(v => parseInt(v.card))
        .filter(n => !isNaN(n));
    const totalVotes = votes.length;
    const averagePoints = numericVotes.length > 0
        ? numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length
        : 0;
    // Sprawdź consensus (wszystkie głosy takie same)
    const uniqueVotes = new Set(votes.map(v => v.card));
    const consensus = uniqueVotes.size <= 1;
    // Najczęstszy głos
    const voteCount = new Map();
    votes.forEach(v => {
        if (v.card) {
            voteCount.set(v.card, (voteCount.get(v.card) || 0) + 1);
        }
    });
    let mostCommonVote = null;
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
    socket.on('create-room', (roomName, userName) => {
        const roomId = generateRoomId();
        const user = {
            id: socket.id,
            name: userName,
            role: 'scrum-master',
            isConnected: true
        };
        const room = {
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
    socket.on('join-room', (roomId, userName) => {
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
        const user = {
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
    socket.on('start-voting', (story) => {
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
        io.to(roomId).emit('voting-started', story);
        io.to(roomId).emit('room-updated', room);
    });
    socket.on('cast-vote', (card) => {
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
        io.to(roomId).emit('room-updated', room);
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
        io.to(roomId).emit('votes-revealed', stats);
        io.to(roomId).emit('room-updated', room);
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
        io.to(roomId).emit('votes-reset');
        io.to(roomId).emit('room-updated', room);
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
        io.to(roomId).emit('voting-ended');
        io.to(roomId).emit('room-updated', room);
    });
    socket.on('disconnect', () => {
        const roomId = userRooms.get(socket.id);
        const room = rooms.get(roomId || '');
        if (room) {
            const user = room.users.find(u => u.id === socket.id);
            if (user) {
                user.isConnected = false;
                socket.to(roomId).emit('user-left', socket.id);
                socket.to(roomId).emit('room-updated', room);
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
//# sourceMappingURL=index.js.map