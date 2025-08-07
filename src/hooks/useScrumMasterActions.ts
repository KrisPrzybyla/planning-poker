import { useToast } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useRoom } from '../context/RoomContext';
import { TOAST_DURATIONS } from '../constants';

export const useScrumMasterActions = () => {
  const { revealResults, resetVoting, endSession } = useRoom();
  const toast = useToast();

  const handleRevealResults = useCallback(() => {
    revealResults();
    toast({
      title: 'Results revealed',
      status: 'info',
      duration: TOAST_DURATIONS.SHORT,
      isClosable: true,
    });
  }, [revealResults, toast]);

  const handleResetVoting = useCallback(() => {
    resetVoting();
    toast({
      title: 'Voting reset',
      description: 'All votes have been cleared',
      status: 'info',
      duration: TOAST_DURATIONS.SHORT,
      isClosable: true,
    });
  }, [resetVoting, toast]);

  const handleEndSession = useCallback(() => {
    endSession();
    toast({
      title: 'Session ended',
      description: 'The session has been terminated',
      status: 'success',
      duration: TOAST_DURATIONS.SHORT,
      isClosable: true,
    });
  }, [endSession, toast]);

  const handleNewVoting = useCallback((isVotingActive: boolean, isResultsVisible: boolean, onOpen: () => void) => {
    // If voting is active and results are not visible, show confirmation
    if (isVotingActive && !isResultsVisible) {
      const confirmed = window.confirm(
        'Voting is currently in progress. Starting a new vote will reset all current votes. Do you want to continue?'
      );
      if (!confirmed) {
        return;
      }
    }
    onOpen();
  }, []);

  return {
    handleRevealResults,
    handleResetVoting,
    handleEndSession,
    handleNewVoting,
  };
};