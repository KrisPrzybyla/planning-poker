import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useRoom } from '../context/RoomContext';

const CreateRoomForm = () => {
  const [userName, setUserName] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createRoom } = useRoom();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to create a room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Zawsze przekazujemy informacje o początkowym głosowaniu, aby automatycznie rozpocząć głosowanie
      const initialStory = {
        title: storyTitle.trim(),
        description: storyDescription.trim()
      };
      
      const roomId = await createRoom(userName, initialStory);
      
      // Przekierowanie do pokoju
      navigate(`/room/${roomId}`);
    } catch (error) {
      toast({
        title: 'Error creating room',
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
          <Heading size="lg">Create Planning Poker Room</Heading>
          <Text mt={2} color="gray.600">
            Start a new session as Scrum Master
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl id="userName" isRequired>
              <FormLabel>Your Name</FormLabel>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                size="lg"
                autoFocus
              />
            </FormControl>

            <FormControl id="storyTitle">
              <FormLabel>Initial Voting Title (optional)</FormLabel>
              <Input
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="Enter voting title or leave empty for auto-naming"
              />
            </FormControl>

            <FormControl id="storyDescription">
              <FormLabel>Description (optional)</FormLabel>
              <Textarea
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isLoading}
              loadingText="Creating Room"
            >
              Create Room
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default CreateRoomForm;