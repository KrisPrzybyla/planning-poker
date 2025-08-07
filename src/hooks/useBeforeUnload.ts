import { useEffect, useCallback } from 'react';

interface UseBeforeUnloadOptions {
  enabled: boolean;
  message?: string;
}

/**
 * Hook to prevent accidental page/tab closure
 * Shows a confirmation dialog when user tries to leave the page
 */
export const useBeforeUnload = ({ enabled, message }: UseBeforeUnloadOptions) => {
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!enabled) return;

    // Cancel the event
    event.preventDefault();
    
    // Chrome requires returnValue to be set
    event.returnValue = message || 'Czy na pewno chcesz opuścić stronę? Utracisz połączenie z sesją Planning Poker.';
    
    // For older browsers
    return message || 'Czy na pewno chcesz opuścić stronę? Utracisz połączenie z sesją Planning Poker.';
  }, [enabled, message]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [enabled, handleBeforeUnload]);

  // Return a function to manually trigger the warning (useful for testing)
  const triggerWarning = useCallback(() => {
    if (enabled) {
      return window.confirm(message || 'Czy na pewno chcesz opuścić stronę? Utracisz połączenie z sesją Planning Poker.');
    }
    return true;
  }, [enabled, message]);

  return { triggerWarning };
};