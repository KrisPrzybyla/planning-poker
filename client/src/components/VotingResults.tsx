import React from 'react';
import type { Room, RoomStats, FibonacciCard } from '../../../shared/types';

interface VotingResultsProps {
  room: Room;
  stats: RoomStats;
}

const VotingResults: React.FC<VotingResultsProps> = ({ room, stats }) => {
  // Grupuj głosy według wartości
  const voteGroups = room.votes.reduce((groups, vote) => {
    if (!vote.card) return groups;
    
    if (!groups[vote.card]) {
      groups[vote.card] = [];
    }
    groups[vote.card].push(vote);
    return groups;
  }, {} as Record<FibonacciCard, typeof room.votes>);

  // Sortuj grupy według wartości Fibonacci
  const fibonacciOrder: FibonacciCard[] = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
  const sortedGroups = Object.entries(voteGroups).sort(([a], [b]) => {
    return fibonacciOrder.indexOf(a as FibonacciCard) - fibonacciOrder.indexOf(b as FibonacciCard);
  });

  const getUserName = (userId: string) => {
    const user = room.users.find(u => u.id === userId);
    return user?.name || 'Nieznany';
  };

  const getConsensusMessage = () => {
    if (stats.consensus) {
      return {
        type: 'success' as const,
        message: '🎉 Consensus osiągnięty!'
      };
    } else if (stats.totalVotes < room.users.filter(u => u.isConnected).length) {
      return {
        type: 'warning' as const,
        message: '⚠️ Nie wszyscy zagłosowali'
      };
    } else {
      return {
        type: 'info' as const,
        message: '💭 Brak consensusu - dyskusja potrzebna'
      };
    }
  };

  const consensusInfo = getConsensusMessage();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📊 Wyniki głosowania
      </h3>

      {/* Status consensusu */}
      <div className={`
        p-4 rounded-lg mb-6
        ${consensusInfo.type === 'success' ? 'bg-success-50 border border-success-200' : ''}
        ${consensusInfo.type === 'warning' ? 'bg-warning-50 border border-warning-200' : ''}
        ${consensusInfo.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
      `}>
        <p className={`
          font-medium text-center
          ${consensusInfo.type === 'success' ? 'text-success-800' : ''}
          ${consensusInfo.type === 'warning' ? 'text-warning-800' : ''}
          ${consensusInfo.type === 'info' ? 'text-blue-800' : ''}
        `}>
          {consensusInfo.message}
        </p>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{stats.totalVotes}</div>
          <div className="text-sm text-gray-600">Głosów</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {stats.averagePoints > 0 ? stats.averagePoints.toFixed(1) : '-'}
          </div>
          <div className="text-sm text-gray-600">Średnia</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {stats.mostCommonVote || '-'}
          </div>
          <div className="text-sm text-gray-600">Najczęstszy</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${stats.consensus ? 'text-success-600' : 'text-warning-600'}`}>
            {stats.consensus ? 'TAK' : 'NIE'}
          </div>
          <div className="text-sm text-gray-600">Consensus</div>
        </div>
      </div>

      {/* Rozkład głosów */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Rozkład głosów:</h4>
        
        {sortedGroups.map(([card, votes]) => (
          <div key={card} className="flex items-center space-x-4">
            <div className="poker-card revealed text-sm w-12 h-16 flex-shrink-0">
              {card}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800">
                  {votes.length} {votes.length === 1 ? 'głos' : 'głosy'}
                </span>
                <span className="text-sm text-gray-600">
                  {((votes.length / stats.totalVotes) * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(votes.length / stats.totalVotes) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {votes.map((vote) => (
                  <span 
                    key={vote.userId}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {getUserName(vote.userId)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rekomendacje */}
      {!stats.consensus && stats.totalVotes > 1 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">💡 Rekomendacje:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Przedyskutujcie różnice w oszacowaniach</li>
            <li>• Osoby z najwyższymi i najniższymi głosami powinny wyjaśnić swoje stanowisko</li>
            <li>• Rozważcie podział story na mniejsze części</li>
            <li>• Po dyskusji zagłosujcie ponownie</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VotingResults;