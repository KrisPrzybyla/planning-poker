import { Box, Heading, useDisclosure } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import ConfirmationModal from './ConfirmationModal';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { room, currentUser } = useRoom();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isInRoom = location.pathname.startsWith('/room/') && room && currentUser;

  const handleHeaderClick = () => {
    if (isInRoom) {
      onOpen(); // Show confirmation modal
    } else {
      navigate('/'); // Direct redirect
    }
  };

  const handleConfirmLeave = () => {
    onClose();
    navigate('/');
  };

  return (
    <>
      <Box 
        bg="brand.500" 
        color="white" 
        py={4} 
        px={6}
        boxShadow="md"
      >
        <Heading 
          size="lg" 
          cursor="pointer" 
          onClick={handleHeaderClick}
          _hover={{ 
            opacity: 0.8,
            transform: 'scale(1.02)',
            transition: 'all 0.2s ease'
          }}
          transition="all 0.2s ease"
          userSelect="none"
        >
          Planning Poker
        </Heading>
      </Box>

      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleConfirmLeave}
        title="Leave Room?"
        message="Are you sure you want to leave the room and return to the home page?"
        confirmText="Yes, Leave Room"
        cancelText="Cancel"
      />
    </>
  );
};

export default Header;