import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { 
  Room, 
  User, 
  RoomStats,
  ServerToClientEvents,
  ClientToServerEvents
} from '../../shared/types';
import WelcomeScreen from './components/WelcomeScreen';
import PlanningRoom from './components/PlanningRoom';
import { getInviteLink, getRoomIdFromUrl, updateUrlForRoom, clearRoomFromUrl } from './utils/urlUtils';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_BACKEND_URL || window.location.origin
    : 'http://localhost:3001',
  {
    transports: ['polling', 'websocket'], // Polling first for Vercel
    upgrade: true,
    timeout: 20000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
);

function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);

  // Check for room ID in URL on app load
  useEffect(() => {
    const roomIdFromUrl = getRoomIdFromUrl();
    if (roomIdFromUrl) {
      setInviteRoomId(roomIdFromUrl);
    }
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('room-updated', (room: Room) => {
      setCurrentRoom(room);
      // Znajdź aktualnego użytkownika w pokoju
      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        setCurrentUser(user);
      }
      // Update URL when room is joined
      updateUrlForRoom(room.id);
    });

    socket.on('error', (message: string) => {
      setError(message);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room-updated');
      socket.off('error');
    };
  }, []);

  const handleCreateRoom = (roomName: string, userName: string) => {
    socket.emit('create-room', roomName, userName);
  };

  const handleJoinRoom = (roomId: string, userName: string) => {
    socket.emit('join-room', roomId, userName);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setCurrentUser(null);
    setInviteRoomId(null);
    clearRoomFromUrl();
    socket.disconnect();
    socket.connect();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🃏 Planning Poker
          </h1>
          <p className="text-gray-600">
            Fibonacci cards for Agile teams
          </p>
          <div className="flex items-center justify-center mt-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Połączono' : 'Rozłączono'}
            </span>
          </div>
        </header>

        {!currentRoom ? (
          <WelcomeScreen 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            inviteRoomId={inviteRoomId}
          />
        ) : (
          <PlanningRoom 
            room={currentRoom}
            currentUser={currentUser}
            socket={socket}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </div>
    </div>
  );
}

export default App;