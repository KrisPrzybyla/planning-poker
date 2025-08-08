import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
} from '@chakra-ui/react';
import { memo } from 'react';

interface VotingCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRevealResults: () => void;
}

const VotingCompleteModal: React.FC<VotingCompleteModalProps> = ({
  isOpen,
  onClose,
  onRevealResults,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>All Participants Have Voted</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>All team members have submitted their votes. You can now reveal the results.</Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onRevealResults}>
            Reveal Results
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default memo(VotingCompleteModal);