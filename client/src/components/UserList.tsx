import React from 'react';
import type { User, Vote } from '../../../shared/types';

interface UserListProps {
  users: User[];
  votes: Vote[];
  isRevealed: boolean;
  isVotingActive: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, votes, isRevealed, isVotingActive }) => {
  const getUserVote = (userId: string) => {
    return votes.find(v => v.userId === userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (user: User) => {
    if (!isVotingActive) return null;
    
    const vote = getUserVote(user.id);
    if (vote) {
      return isRevealed ? (
        <span className="text-success-600 text-sm">✓</span>
      ) : (
        <span className="text-primary-600 text-sm">✓</span>
      );
    }
    
    return user.isConnected ? (
      <span className="text-gray-400 text-sm">⏳</span>
    ) : (
      <span className="text-red-400 text-sm">⚠</span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Uczestnicy ({users.filter(u => u.isConnected).length})
      </h3>
      
      <div className="space-y-3">
        {users.map((user) => {
          const vote = getUserVote(user.id);
          
          return (
            <div
              key={user.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${user.isConnected ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-25 opacity-60'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="user-avatar">
                  {getInitials(user.name)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {user.name}
                    </span>
                    {user.role === 'scrum-master' && (
                      <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                        SM
                      </span>
                    )}
                  </div>
                  
                  {!user.isConnected && (
                    <span className="text-xs text-gray-500">Rozłączony</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isRevealed && vote && (
                  <div className="poker-card revealed text-sm w-8 h-12">
                    {vote.card}
                  </div>
                )}
                {getStatusIcon(user)}
              </div>
            </div>
          );
        })}
      </div>
      
      {isVotingActive && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Zagłosowało:</span>
              <span className="font-medium">
                {votes.length} / {users.filter(u => u.isConnected).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;