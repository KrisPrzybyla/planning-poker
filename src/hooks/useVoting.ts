import { useToast } from '@chakra-ui/react';
import { useCallback } from 'react';
import { FibonacciCard as FibonacciCardType, Room, User } from '../types';
import { TOAST_DURATIONS } from '../constants';

interface UseVotingProps {
  room: Room | null;
  currentUser: User | null;
  submitVote: (value: FibonacciCardType) => void;
}

export const useVoting = ({ room, currentUser, submitVote }: UseVotingProps) => {
  const toast = useToast();

  // Get current user's vote if any
  const getCurrentUserVote = useCallback(() => {
    if (!room?.currentStory || !currentUser) return undefined;
    const userVote = room.currentStory.votes.find((vote) => vote.userId === currentUser.id);
    return userVote?.value;
  }, [room?.currentStory, currentUser]);

  const handleSelectCard = useCallback((value: FibonacciCardType) => {
    const currentVote = getCurrentUserVote();
    const isChangingVote = currentVote && currentVote !== value;
    
    submitVote(value);
    toast({
      title: isChangingVote ? 'Vote changed' : 'Vote submitted',
      description: 'You can change your vote anytime before results are revealed',
      status: 'success',
      duration: TOAST_DURATIONS.MEDIUM,
      isClosable: true,
    });
  }, [getCurrentUserVote, submitVote, toast]);

  return {
    getCurrentUserVote,
    handleSelectCard,
  };
};