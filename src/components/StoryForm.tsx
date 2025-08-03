import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { useRoom } from '../context/RoomContext';

interface StoryFormProps {
  onClose?: () => void;
}

const StoryForm = ({ onClose }: StoryFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { startVoting } = useRoom();
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If title is empty, it will be set to "Voting #X" on the server side
    const finalTitle = title.trim() || '';

    setIsLoading(true);
    
    try {
      startVoting({ title: finalTitle, description });
      toast({
        title: 'Voting started',
        description: 'New voting has been started',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      if (onClose) onClose();
    } catch (error) {
      toast({
        title: 'Error starting voting',
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
    <Box p={4}>
      <Heading size="md" mb={4}>
        Add New Voting
      </Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="title">
            <FormLabel>Voting Title (optional)</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter voting title or leave empty for auto-naming"
            />
          </FormControl>

          <FormControl id="description">
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter story description (optional)"
              rows={4}
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Starting Voting"
          >
            Start Voting
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default StoryForm;