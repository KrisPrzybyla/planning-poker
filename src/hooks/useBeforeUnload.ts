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
    event.returnValue = message || 'Are you sure you want to leave? You will lose your connection to the Planning Poker session.';
    
    // For older browsers
    return message || 'Are you sure you want to leave? You will lose your connection to the Planning Poker session.';
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
      return window.confirm(message || 'Are you sure you want to leave? You will lose your connection to the Planning Poker session.');
    }
    return true;
  }, [enabled, message]);

  return { triggerWarning };
};