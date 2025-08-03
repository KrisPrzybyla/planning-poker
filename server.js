import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store rooms in memory (in a real app, you'd use a database)
const rooms = new Map();

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
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('createRoom', ({ userName, initialStory }, callback) => {
    try {
      const roomId = createUniqueRoomCode();
      const userId = uuidv4();

      // Create user object
      const user = {
        id: userId,
        name: userName,
        role: 'Scrum Master', // Creator is always Scrum Master
        roomId,
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
      callback({ success: true, roomId, user });

      // Broadcast room update to all users in the room
      io.to(roomId).emit('roomUpdated', room);

      console.log(`Room created: ${roomId} by ${userName}`);
      
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

        console.log(`Voting started in room ${roomId} for story: ${storyTitle}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomId, userName }, callback) => {
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

      console.log(`User ${userName} joined room: ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Start voting on a story
  socket.on('startVoting', ({ roomId, story }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const userId = socket.data.userId;

      // Check if user is Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || user.role !== 'Scrum Master') return;

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

      console.log(`Voting started in room ${roomId} for story: ${storyTitle}`);
    } catch (error) {
      console.error('Error starting voting:', error);
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

      // Add new vote
      room.currentStory.votes.push({ userId, value });

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      console.log(`User ${userId} voted ${value} in room ${roomId}`);
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  });

  // Reveal voting results
  socket.on('revealResults', ({ roomId }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const userId = socket.data.userId;

      // Check if user is Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || user.role !== 'Scrum Master') return;

      // Update room
      room.isResultsVisible = true;

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      console.log(`Results revealed in room ${roomId}`);
    } catch (error) {
      console.error('Error revealing results:', error);
    }
  });

  // Reset voting
  socket.on('resetVoting', ({ roomId }) => {
    try {
      // Check if room exists
      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const userId = socket.data.userId;

      // Check if user is Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || user.role !== 'Scrum Master') return;

      // Clear votes if there's a current story
      if (room.currentStory) {
        room.currentStory.votes = [];
      }

      // Reset voting state
      room.isVotingActive = true;
      room.isResultsVisible = false;

      // Broadcast room update
      io.to(roomId).emit('roomUpdated', room);

      console.log(`Voting reset in room ${roomId}`);
    } catch (error) {
      console.error('Error resetting voting:', error);
    }
  });

  // End session
  socket.on('endSession', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.find(u => u.id === socket.data.userId);
    if (!user || user.role !== 'Scrum Master') return;

    io.to(roomId).emit('sessionEnded');
    rooms.delete(roomId);
    console.log(`Session ended for room ${roomId}`);
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
          console.log(`User ${user.name} disconnected from room ${roomId}`);

          // Remove user from room
          room.users.splice(userIndex, 1);

          // If room is empty, remove it
          if (room.users.length === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} removed (empty)`);
          } else {
            // If Scrum Master left, promote first user to Scrum Master
            if (user.role === 'Scrum Master' && room.users.length > 0) {
              room.users[0].role = 'Scrum Master';
              console.log(`User ${room.users[0].name} promoted to Scrum Master in room ${roomId}`);
            }

            // Broadcast room update
            io.to(roomId).emit('roomUpdated', room);
          }
        }
      }

      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Planning Poker Server is running');
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});