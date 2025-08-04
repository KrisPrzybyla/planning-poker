import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

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

      console.log(`User ${userName} joined room: ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Rejoin an existing room (for page refresh)
  socket.on('rejoinRoom', ({ roomId, userId }, callback) => {
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

      console.log(`User ${user.name} rejoined room: ${roomId}`);
    } catch (error) {
      console.error('Error rejoining room:', error);
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

      // Check if user is Scrum Master or Temporary Scrum Master
      const user = room.users.find((u) => u.id === userId);
      if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master')) return;

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
    if (!user || (user.role !== 'Scrum Master' && user.role !== 'Temporary Scrum Master')) return;

    io.to(roomId).emit('sessionEnded');
    rooms.delete(roomId);
    console.log(`Session ended for room ${roomId}`);
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
      console.log(`User ${userToRemove.name} removed from room ${roomId} by ${requestingUser.name}`);
    } catch (error) {
      console.error('Error removing user:', error);
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
          console.log(`User ${user.name} disconnected from room ${roomId}`);

          // Mark user as disconnected but don't remove immediately
          user.isConnected = false;
          user.disconnectedAt = Date.now();

          // If disconnected user is Scrum Master, promote temporary SM
          if (user.role === 'Scrum Master') {
            // Find the oldest connected participant to promote
            const connectedUsers = room.users.filter(u => u.isConnected && u.id !== userId);
            if (connectedUsers.length > 0) {
              // Mark original SM as temporarily displaced
              user.role = 'Displaced Scrum Master';
              
              // Promote first connected user to temporary SM
              connectedUsers[0].role = 'Temporary Scrum Master';
              
              console.log(`User ${connectedUsers[0].name} promoted to Temporary Scrum Master in room ${roomId} (original SM disconnected)`);
              
              // Send notification about SM change
              io.to(roomId).emit('scrumMasterChanged', {
                newScrumMaster: connectedUsers[0],
                reason: 'original_disconnected',
                originalScrumMaster: user
              });
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
                  console.log(`Removing user ${currentUser.name} from room ${roomId} after timeout`);
                  
                  // Remove user from room
                  currentRoom.users.splice(currentUserIndex, 1);

                  // If room is empty, remove it
                  if (currentRoom.users.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} removed (empty)`);
                  } else {
                    // If any type of Scrum Master left permanently, promote first user to Scrum Master
                    if ((currentUser.role === 'Scrum Master' || currentUser.role === 'Displaced Scrum Master' || currentUser.role === 'Temporary Scrum Master') && currentRoom.users.length > 0) {
                      // Find first connected user to promote
                      const connectedUser = currentRoom.users.find(u => u.isConnected);
                      if (connectedUser) {
                        connectedUser.role = 'Scrum Master';
                        console.log(`User ${connectedUser.name} promoted to Scrum Master in room ${roomId} (previous SM left permanently)`);
                        
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

      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Handle React Router (SPA) - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});