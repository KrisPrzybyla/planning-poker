import { useEffect, useState } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { Room, User } from '../types';
import { TIMEOUTS } from '../constants';

interface UseVotingModalProps {
  room: Room | null;
  currentUser: User | null;
}

export const useVotingModal = ({ room, currentUser }: UseVotingModalProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalShownForStory, setModalShownForStory] = useState<string | null>(null);

  // Check if all participants have voted
  const allParticipantsVoted = () => {
    if (!room?.currentStory || !room.isVotingActive || room.isResultsVisible) return false;
    
    const allUsers = room.users;
    if (allUsers.length === 0) return false;
    
    const votes = room.currentStory.votes;
    
    return allUsers.length > 0 && allUsers.every(user => 
      votes.some(vote => vote.userId === user.id)
    );
  };

  // Open modal when all participants have voted (only for Scrum Master)
  useEffect(() => {
    if (!room?.currentStory || !currentUser || currentUser.role !== 'Scrum Master') return;
    
    const storyId = room.currentStory.id;
    
    const timer = setTimeout(() => {
      if (allParticipantsVoted() && 
          !isOpen && 
          !room.isResultsVisible && 
          modalShownForStory !== storyId) {
        setModalShownForStory(storyId);
        onOpen();
      }
    }, TIMEOUTS.VOTE_PROCESSING_DELAY);

    return () => clearTimeout(timer);
  }, [room?.currentStory?.votes, room?.currentStory?.id, isOpen, onOpen, currentUser?.role, room?.isResultsVisible, modalShownForStory]);

  // Reset modal state when new voting starts
  useEffect(() => {
    if (room?.isVotingActive && !room?.isResultsVisible && room?.currentStory) {
      setModalShownForStory(null);
    }
  }, [room?.isVotingActive, room?.isResultsVisible, room?.currentStory?.id]);

  return {
    isOpen,
    onOpen,
    onClose,
    allParticipantsVoted,
  };
};