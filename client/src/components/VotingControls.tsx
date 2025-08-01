import React, { useState } from 'react';
import type { Room } from '../../../shared/types';

interface VotingControlsProps {
  room: Room;
  allVoted: boolean;
  onStartVoting: (story: string) => void;
  onRevealVotes: () => void;
  onResetVotes: () => void;
  onEndVoting: () => void;
}

const VotingControls: React.FC<VotingControlsProps> = ({
  room,
  allVoted,
  onStartVoting,
  onRevealVotes,
  onResetVotes,
  onEndVoting
}) => {
  const [storyInput, setStoryInput] = useState('');

  const handleStartVoting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyInput.trim()) return;
    
    onStartVoting(storyInput.trim());
    setStoryInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Kontrola głosowania
      </h3>
      
      {!room.isVotingActive ? (
        <form onSubmit={handleStartVoting} className="space-y-4">
          <div>
            <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-1">
              Story do oszacowania
            </label>
            <input
              type="text"
              id="story"
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="np. Jako użytkownik chcę móc..."
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            🚀 Rozpocznij głosowanie
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {!room.isRevealed ? (
            <>
              <button
                onClick={onRevealVotes}
                disabled={room.votes.length === 0}
                className={`
                  w-full py-2 px-4 rounded-md transition-colors
                  ${room.votes.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : allVoted
                    ? 'bg-success-500 text-white hover:bg-success-600'
                    : 'bg-warning-500 text-white hover:bg-warning-600'
                  }
                `}
              >
                {allVoted ? '✅ Pokaż wyniki' : '👁 Pokaż wyniki (nie wszyscy zagłosowali)'}
              </button>
              
              <button
                onClick={onResetVotes}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                🔄 Resetuj głosy
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onResetVotes}
                className="w-full bg-warning-500 text-white py-2 px-4 rounded-md hover:bg-warning-600 transition-colors"
              >
                🔄 Głosuj ponownie
              </button>
              
              <button
                onClick={onEndVoting}
                className="w-full bg-success-500 text-white py-2 px-4 rounded-md hover:bg-success-600 transition-colors"
              >
                ✅ Zakończ głosowanie
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VotingControls;