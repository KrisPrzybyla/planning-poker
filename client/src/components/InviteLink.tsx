import React, { useState } from 'react';
import { getInviteLink, copyToClipboard } from '../utils/urlUtils';

interface InviteLinkProps {
  roomId: string;
  roomName: string;
}

const InviteLink: React.FC<InviteLinkProps> = ({ roomId, roomName }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const inviteLink = getInviteLink(roomId);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(inviteLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
      try {
        await navigator.share({
          title: `Planning Poker - ${roomName}`,
          text: `Dołącz do sesji Planning Poker: ${roomName}`,
          url: inviteLink,
        });
      } catch (error) {
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback to copying link
      handleCopyLink();
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
        <span className="mr-2">🔗</span>
        Zaproś uczestników
      </h4>
      
      <div className="space-y-3">
        {/* Invite Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link zaproszenia
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                copied 
                  ? 'bg-success-500 text-white' 
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Room Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kod pokoju
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={roomId}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-lg font-mono font-bold text-center tracking-wider"
            />
            <button
              onClick={handleCopyCode}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                copied 
                  ? 'bg-success-500 text-white' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleShare}
            className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <span className="mr-1">📤</span>
            {typeof navigator !== 'undefined' && 'share' in navigator ? 'Udostępnij' : 'Kopiuj link'}
          </button>
          
          <button
            onClick={() => setShowQR(!showQR)}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            📱 QR
          </button>
        </div>

        {/* QR Code Placeholder */}
        {showQR && (
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 text-center">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2">
              <div className="text-4xl">📱</div>
            </div>
            <p className="text-sm text-gray-600">
              QR kod dla: <br />
              <span className="font-mono text-xs break-all">{inviteLink}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              (W pełnej wersji byłby tutaj prawdziwy QR kod)
            </p>
          </div>
        )}

        {copied && (
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-success-100 text-success-800">
              <span className="mr-1">✓</span>
              Skopiowano do schowka!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteLink;