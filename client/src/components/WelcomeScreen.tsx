import React, { useState } from 'react';

interface WelcomeScreenProps {
  onCreateRoom: (roomName: string, userName: string) => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  inviteRoomId?: string | null;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateRoom, onJoinRoom, inviteRoomId }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(inviteRoomId ? 'join' : 'create');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState(inviteRoomId || '');
  const [userName, setUserName] = useState('');

  // Update roomId when inviteRoomId changes
  React.useEffect(() => {
    if (inviteRoomId) {
      setRoomId(inviteRoomId);
      setActiveTab('join');
    }
  }, [inviteRoomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    if (activeTab === 'create') {
      if (!roomName.trim()) return;
      onCreateRoom(roomName.trim(), userName.trim());
    } else {
      if (!roomId.trim()) return;
      onJoinRoom(roomId.trim().toUpperCase(), userName.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'create'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Utwórz pokój
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'join'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('join')}
          >
            Dołącz do pokoju
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              Twoje imię
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Wpisz swoje imię"
              required
            />
          </div>

          {activeTab === 'create' ? (
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa pokoju
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="np. Sprint Planning"
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                Kod pokoju
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase tracking-wider"
                placeholder="ABC123"
                maxLength={6}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            {activeTab === 'create' ? 'Utwórz pokój' : 'Dołącz do pokoju'}
          </button>
        </form>
      </div>

      {/* Invite Info */}
      {inviteRoomId && (
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <span className="text-primary-600 mr-2">🔗</span>
            <span className="font-medium text-primary-800">
              Zostałeś zaproszony do pokoju
            </span>
          </div>
          <div className="text-center">
            <span className="font-mono font-bold text-lg text-primary-700">
              {inviteRoomId}
            </span>
          </div>
          <p className="text-sm text-primary-600 text-center mt-1">
            Wpisz swoje imię i dołącz do sesji Planning Poker
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p className="mb-2">
          <strong>Karty Fibonacci:</strong> 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕
        </p>
        <p>
          <strong>?</strong> = Nie wiem &nbsp;&nbsp;
          <strong>☕</strong> = Potrzebuję przerwy
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;