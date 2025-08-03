import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { useRoom } from '../context/RoomContext';
import StoryForm from './StoryForm';

interface ScrumMasterControlsProps {
  isVotingActive: boolean;
  isResultsVisible: boolean;
  hasStory: boolean;
}

const ScrumMasterControls = ({
  isVotingActive,
  isResultsVisible,
  hasStory,
}: ScrumMasterControlsProps) => {
  const { 
    revealResults, 
    resetVoting, 
    endSession,
    room,
    socket 
  } = useRoom();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleRevealResults = () => {
    revealResults();
    toast({
      title: 'Results revealed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleResetVoting = () => {
    resetVoting();
    toast({
      title: 'Voting reset',
      description: 'All votes have been cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      endSession();
      toast({
        title: 'Session ended',
        description: 'The session has been terminated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
        <Flex direction="column" gap={3}>
          <Button
            colorScheme="blue"
            onClick={onOpen}
            isDisabled={isVotingActive && !isResultsVisible}
          >
            {hasStory ? 'New Voting' : 'Add Voting'}
          </Button>

          <ButtonGroup isAttached variant="outline" width="full">
            <Button
              flex={1}
              colorScheme="green"
              onClick={handleRevealResults}
              isDisabled={!isVotingActive || isResultsVisible || !hasStory}
            >
              Reveal Results
            </Button>
            <Button
              flex={1}
              colorScheme="orange"
              onClick={handleResetVoting}
              isDisabled={!hasStory}
            >
              Reset Voting
            </Button>
          </ButtonGroup>

          <Button colorScheme="red" variant="outline" onClick={handleEndSession}>
            End Session
          </Button>
        </Flex>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <StoryForm onClose={onClose} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScrumMasterControls;