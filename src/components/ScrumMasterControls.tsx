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
} from '@chakra-ui/react';
import StoryForm from './StoryForm';
import ConfirmationModal from './ConfirmationModal';
import { useScrumMasterActions } from '../hooks/useScrumMasterActions';

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEndSessionOpen, onOpen: onEndSessionOpen, onClose: onEndSessionClose } = useDisclosure();
  
  const {
    handleRevealResults,
    handleResetVoting,
    handleEndSession: handleEndSessionAction,
    handleNewVoting: handleNewVotingAction,
  } = useScrumMasterActions();

  const handleEndSession = () => {
    onEndSessionOpen();
  };

  const handleConfirmEndSession = () => {
    onEndSessionClose();
    handleEndSessionAction();
  };

  const handleNewVoting = () => {
    handleNewVotingAction(isVotingActive, isResultsVisible, onOpen);
  };

  return (
    <>
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
        <Flex direction="column" gap={3}>
          <Button
            colorScheme="blue"
            onClick={handleNewVoting}
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

      <ConfirmationModal
        isOpen={isEndSessionOpen}
        onClose={onEndSessionClose}
        onConfirm={handleConfirmEndSession}
        title="End Session?"
        message="Are you sure you want to end this session? This action cannot be undone."
        confirmText="Yes, End Session"
        cancelText="Cancel"
      />
    </>
  );
};

export default ScrumMasterControls;