import React, { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { 
  Room, 
  User, 
  FibonacciCard,
  RoomStats,
  ServerToClientEvents,
  ClientToServerEvents
} from '../../../shared/types';
import FibonacciCards from './FibonacciCards';
import UserList from './UserList';
import VotingControls from './VotingControls';
import VotingResults from './VotingResults';
import InviteLink from './InviteLink';

interface PlanningRoomProps {
  room: Room;
  currentUser: User | null;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  onLeaveRoom: () => void;
}

const PlanningRoom: React.FC<PlanningRoomProps> = ({ 
  room, 
  currentUser, 
  socket, 
  onLeaveRoom 
}) => {
  const [selectedCard, setSelectedCard] = useState<FibonacciCard | null>(null);
  const [votingStats, setVotingStats] = useState<RoomStats | null>(null);

  const isScrumMaster = currentUser?.role === 'scrum-master';
  const hasVoted = room.votes.some(v => v.userId === currentUser?.id);
  const allVoted = room.users.filter(u => u.isConnected).length === room.votes.length;

  useEffect(() => {
    socket.on('voting-started', () => {
      setSelectedCard(null);
      setVotingStats(null);
    });

    socket.on('votes-revealed', (stats: RoomStats) => {
      setVotingStats(stats);
    });

    socket.on('votes-reset', () => {
      setSelectedCard(null);
      setVotingStats(null);
    });

    socket.on('voting-ended', () => {
      setSelectedCard(null);
      setVotingStats(null);
    });

    return () => {
      socket.off('voting-started');
      socket.off('votes-revealed');
      socket.off('votes-reset');
      socket.off('voting-ended');
    };
  }, [socket]);

  const handleCardSelect = (card: FibonacciCard) => {
    if (!room.isVotingActive || room.isRevealed) return;
    
    setSelectedCard(card);
    socket.emit('cast-vote', card);
  };

  const handleStartVoting = (story: string) => {
    socket.emit('start-voting', story);
  };

  const handleRevealVotes = () => {
    socket.emit('reveal-votes');
  };

  const handleResetVotes = () => {
    socket.emit('reset-votes');
  };

  const handleEndVoting = () => {
    socket.emit('end-voting');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{room.name}</h2>
            <p className="text-gray-600">Kod pokoju: <span className="font-mono font-bold">{room.id}</span></p>
            {room.currentStory && (
              <p className="text-primary-600 mt-2">
                <strong>Story:</strong> {room.currentStory}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isScrumMaster && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                Scrum Master
              </span>
            )}
            <button
              onClick={onLeaveRoom}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Opuść pokój
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Users & Invite */}
        <div className="lg:col-span-1 space-y-6">
          <UserList 
            users={room.users} 
            votes={room.votes}
            isRevealed={room.isRevealed}
            isVotingActive={room.isVotingActive}
          />
          
          <InviteLink 
            roomId={room.id}
            roomName={room.name}
          />
        </div>

        {/* Right Column - Voting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voting Controls */}
          {isScrumMaster && (
            <VotingControls
              room={room}
              allVoted={allVoted}
              onStartVoting={handleStartVoting}
              onRevealVotes={handleRevealVotes}
              onResetVotes={handleResetVotes}
              onEndVoting={handleEndVoting}
            />
          )}

          {/* Voting Status */}
          {room.isVotingActive && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Status głosowania
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {room.votes.length} / {room.users.filter(u => u.isConnected).length} głosów
                  </span>
                  {allVoted && (
                    <span className="bg-success-100 text-success-800 px-2 py-1 rounded text-sm">
                      Wszyscy zagłosowali!
                    </span>
                  )}
                </div>
              </div>
              
              {hasVoted && selectedCard && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Twój głos:</p>
                  <div className="inline-block poker-card selected">
                    {selectedCard}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fibonacci Cards */}
          {room.isVotingActive && !room.isRevealed && (
            <FibonacciCards
              selectedCard={selectedCard}
              onCardSelect={handleCardSelect}
              disabled={hasVoted}
            />
          )}

          {/* Voting Results */}
          {room.isRevealed && votingStats && (
            <VotingResults
              room={room}
              stats={votingStats}
            />
          )}

          {/* Instructions */}
          {!room.isVotingActive && (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Oczekiwanie na rozpoczęcie głosowania
              </h3>
              <p className="text-gray-600">
                {isScrumMaster 
                  ? 'Rozpocznij głosowanie wprowadzając story do oszacowania.'
                  : 'Scrum Master rozpocznie głosowanie w odpowiednim momencie.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningRoom;