import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import JoinRoomForm from '../components/JoinRoomForm';

const JoinPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) {
      navigate('/');
    }
  }, [roomId, navigate]);

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Join Planning Poker Room
          </Heading>
          <Text fontSize="lg" color="gray.600">
            You've been invited to join a Planning Poker session
          </Text>
        </Box>

        <JoinRoomForm initialRoomId={roomId} />
      </VStack>
    </Container>
  );
};

export default JoinPage;