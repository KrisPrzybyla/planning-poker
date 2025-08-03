import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useRoom } from '../context/RoomContext';
import { formatRoomCode } from '../utils/votingUtils';

interface JoinRoomFormProps {
  initialRoomId?: string;
}

const JoinRoomForm = ({ initialRoomId }: JoinRoomFormProps) => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const [roomId, setRoomId] = useState(initialRoomId || urlRoomId || '');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { joinRoom } = useRoom();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (urlRoomId) {
      setRoomId(urlRoomId);
    }
  }, [urlRoomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim()) {
      toast({
        title: 'Room code required',
        description: 'Please enter a room code to join',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!userName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to join the room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Clean up room ID (remove spaces, uppercase)
      const cleanRoomId = roomId.replace(/\s+/g, '').toUpperCase();
      await joinRoom(cleanRoomId, userName);
      navigate(`/room/${cleanRoomId}`);
    } catch (error) {
      toast({
        title: 'Error joining room',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg">Join Planning Poker Room</Heading>
          <Text mt={2} color="gray.600">
            Enter a room code to join an existing session
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl id="roomId" isRequired>
              <FormLabel>Room Code</FormLabel>
              <Input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter 6-digit room code"
                size="lg"
                textTransform="uppercase"
              />
            </FormControl>

            <FormControl id="userName" isRequired>
              <FormLabel>Your Name</FormLabel>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                size="lg"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isLoading}
              loadingText="Joining Room"
            >
              Join Room
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default JoinRoomForm;