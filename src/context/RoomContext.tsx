import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, User, Story, VotingStats } from '../types';
import { calculateVotingStats } from '../utils/votingUtils';

interface RoomContextType {
  socket: Socket | null;
  room: Room | null;
  currentUser: User | null;
  isConnected: boolean;
  error: string | null;
  votingStats: VotingStats | null;
  createRoom: (userName: string, initialStory?: Omit<Story, 'id' | 'votes'>) => Promise<string>;
  joinRoom: (roomId: string, userName: string) => Promise<void>;
  startVoting: (story: Omit<Story, 'id' | 'votes'>) => void;
  submitVote: (value: string) => void;
  revealResults: () => void;
  resetVoting: () => void;
  endSession: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider = ({ children }: RoomProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem('planningPoker_currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null);

  // Use refs to access current values in event handlers
  const currentUserRef = useRef<User | null>(null);
  const roomRef = useRef<Room | null>(null);

  // Update refs when state changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Save current user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('planningPoker_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('planningPoker_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://localhost');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('error', (errorMessage: string) => {
      setError(errorMessage);
    });

    socketInstance.on('roomUpdated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      
      // Calculate voting stats if results are visible
      if (updatedRoom.isResultsVisible && updatedRoom.currentStory) {
        setVotingStats(calculateVotingStats(updatedRoom.currentStory.votes));
      } else {
        setVotingStats(null);
      }
    });

    socketInstance.on('sessionEnded', () => {
      // Clear room data
      setRoom(null);
      setCurrentUser(null);
      setVotingStats(null);
      
      // Redirect to home page
      window.location.href = '/';
    });

    socketInstance.on('scrumMasterChanged', (data: { newScrumMaster: User; reason: string; originalScrumMaster?: User; previousTempScrumMaster?: User; removedUser?: User }) => {
      // Update current user if they are affected by the change
      const currentUserValue = currentUserRef.current;
      if (currentUserValue) {
        if (currentUserValue.id === data.newScrumMaster.id) {
          setCurrentUser(data.newScrumMaster);
        } else if (data.previousTempScrumMaster && currentUserValue.id === data.previousTempScrumMaster.id) {
          setCurrentUser({ ...currentUserValue, role: 'Participant' });
        } else if (data.originalScrumMaster && currentUserValue.id === data.originalScrumMaster.id) {
          setCurrentUser({ ...currentUserValue, role: data.originalScrumMaster.role });
        }
      }
      
      // Update room state to reflect role changes
      const roomValue = roomRef.current;
      if (roomValue) {
        const updatedRoom = { ...roomValue };
        updatedRoom.users = updatedRoom.users.map(user => {
          if (user.id === data.newScrumMaster.id) {
            return { ...user, role: data.newScrumMaster.role };
          } else if (data.previousTempScrumMaster && user.id === data.previousTempScrumMaster.id) {
            return { ...user, role: 'Participant' };
          } else if (data.originalScrumMaster && user.id === data.originalScrumMaster.id) {
            return { ...user, role: data.originalScrumMaster.role };
          }
          return user;
        });
        setRoom(updatedRoom);
      }
      
      // Show notification based on reason
      const messages = {
        'original_disconnected': `${data.newScrumMaster.name} is now the temporary Scrum Master (original SM disconnected)`,
        'original_reconnected': `${data.newScrumMaster.name} has returned as Scrum Master`,
        'permanent_promotion': `${data.newScrumMaster.name} is now the Scrum Master`
      };
      
      // You can add toast notification here if needed
      console.log(messages[data.reason as keyof typeof messages] || 'Scrum Master changed');
    });

    // Auto-rejoin room if user data exists and we're on a room page
    socketInstance.on('connect', () => {
      const savedUser = localStorage.getItem('planningPoker_currentUser');
      const currentPath = window.location.pathname;
      const roomMatch = currentPath.match(/^\/room\/(.+)$/);
      
      if (savedUser && roomMatch) {
        const user = JSON.parse(savedUser);
        const roomId = roomMatch[1];
        
        // Try to rejoin the room
        socketInstance.emit('rejoinRoom', { roomId, userId: user.id }, (response: { success: boolean; user?: User; error?: string }) => {
          if (response.success && response.user) {
            setCurrentUser(response.user);
          } else {
            // If rejoin fails, clear saved data and redirect to join page
            localStorage.removeItem('planningPoker_currentUser');
            setCurrentUser(null);
            window.location.href = `/join/${roomId}`;
          }
        });
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = async (userName: string, initialStory?: Omit<Story, 'id' | 'votes'>): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject('Socket not connected');
        return;
      }

      socket.emit('createRoom', { userName, initialStory }, (response: { success: boolean; roomId?: string; user?: User; error?: string }) => {
        if (response.success && response.roomId && response.user) {
          setCurrentUser(response.user);
          resolve(response.roomId);
        } else {
          setError(response.error || 'Failed to create room');
          reject(response.error || 'Failed to create room');
        }
      });
    });
  };

  const joinRoom = async (roomId: string, userName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject('Socket not connected');
        return;
      }

      socket.emit('joinRoom', { roomId, userName }, (response: { success: boolean; user?: User; error?: string }) => {
        if (response.success && response.user) {
          setCurrentUser(response.user);
          resolve();
        } else {
          setError(response.error || 'Failed to join room');
          reject(response.error || 'Failed to join room');
        }
      });
    });
  };

  const startVoting = (story: Omit<Story, 'id' | 'votes'>) => {
    if (!socket || !room || !currentUser || (currentUser.role !== 'Scrum Master' && currentUser.role !== 'Temporary Scrum Master')) {
      setError('Only Scrum Master can start voting');
      return;
    }

    socket.emit('startVoting', { roomId: room.id, story });
  };

  const submitVote = (value: string) => {
    if (!socket || !room || !currentUser || !room.currentStory || !room.isVotingActive) {
      setError('Cannot submit vote at this time');
      return;
    }

    socket.emit('submitVote', { roomId: room.id, userId: currentUser.id, value });
  };

  const revealResults = () => {
    if (!socket || !room || !currentUser || (currentUser.role !== 'Scrum Master' && currentUser.role !== 'Temporary Scrum Master')) {
      setError('Only Scrum Master can reveal results');
      return;
    }

    socket.emit('revealResults', { roomId: room.id });
  };

  const resetVoting = () => {
    if (!socket || !room || !currentUser || (currentUser.role !== 'Scrum Master' && currentUser.role !== 'Temporary Scrum Master')) {
      setError('Only Scrum Master can reset voting');
      return;
    }

    socket.emit('resetVoting', { roomId: room.id });
  };

  const endSession = () => {
    if (!socket || !room || !currentUser || (currentUser.role !== 'Scrum Master' && currentUser.role !== 'Temporary Scrum Master')) {
      setError('Only Scrum Master can end session');
      return;
    }

    socket.emit('endSession', { roomId: room.id });
  };

  const value = {
    socket,
    room,
    currentUser,
    isConnected,
    error,
    votingStats,
    createRoom,
    joinRoom,
    startVoting,
    submitVote,
    revealResults,
    resetVoting,
    endSession,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};