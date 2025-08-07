import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { TIMEOUTS } from '../constants';

interface UseAutoRedirectProps {
  roomId: string | undefined;
  currentUser: User | null;
  isConnected: boolean;
  error: string | null;
}

export const useAutoRedirect = ({ roomId, currentUser, isConnected, error }: UseAutoRedirectProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId || !isConnected) return;

    // Give some time for auto-rejoin to work before redirecting
    const timer = setTimeout(() => {
      // If user is not in a room after auto-rejoin attempt, redirect to join page
      if (isConnected && !currentUser && !error) {
        navigate(`/join/${roomId}`);
      }
    }, TIMEOUTS.AUTO_REJOIN_DELAY);

    return () => clearTimeout(timer);
  }, [roomId, currentUser, isConnected, error, navigate]);
};