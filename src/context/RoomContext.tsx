import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, User, Story, Vote, VotingStats } from '../types';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://localhost:3001');
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
    if (!socket || !room || !currentUser || currentUser.role !== 'Scrum Master') {
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
    if (!socket || !room || !currentUser || currentUser.role !== 'Scrum Master') {
      setError('Only Scrum Master can reveal results');
      return;
    }

    socket.emit('revealResults', { roomId: room.id });
  };

  const resetVoting = () => {
    if (!socket || !room || !currentUser || currentUser.role !== 'Scrum Master') {
      setError('Only Scrum Master can reset voting');
      return;
    }

    socket.emit('resetVoting', { roomId: room.id });
  };

  const endSession = () => {
    if (!socket || !room || !currentUser || currentUser.role !== 'Scrum Master') {
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