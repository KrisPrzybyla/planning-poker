import { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { Room, User, Story, VotingStats } from '../types';

export interface RoomContextType {
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
  removeUser: (userIdToRemove: string) => Promise<void>;
}

export const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
