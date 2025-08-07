import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useRoom } from '../context/RoomContext';
import FibonacciDeck from '../components/FibonacciDeck';
import RoomInfo from '../components/RoomInfo';
import ParticipantsList from '../components/ParticipantsList';
import CurrentStory from '../components/CurrentStory';
import VotingResults from '../components/VotingResults';
import ScrumMasterControls from '../components/ScrumMasterControls';
import { FibonacciCard as FibonacciCardType } from '../types';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalShownForStory, setModalShownForStory] = useState<string | null>(null);
  const {
    room,
    currentUser,
    isConnected,
    error,
    votingStats,
    submitVote,
    revealResults,
  } = useRoom();

  // Check if all participants have voted (including Scrum Master if they can vote)
  const allParticipantsVoted = () => {
    if (!room?.currentStory || !room.isVotingActive || room.isResultsVisible) return false;
    
    // Get all users who should vote (all users in the room)
    const allUsers = room.users;
    if (allUsers.length === 0) return false;
    
    // Count votes
    const votes = room.currentStory.votes;
    
    // Check if all users have voted
    return allUsers.length > 0 && allUsers.every(user => 
      votes.some(vote => vote.userId === user.id)
    );
  };

  // Open modal when all participants have voted (only for Scrum Master)
  useEffect(() => {
    if (!room?.currentStory || !currentUser || currentUser.role !== 'Scrum Master') return;
    
    const storyId = room.currentStory.id;
    
    // Add a small delay to ensure all votes are processed
    const timer = setTimeout(() => {
      if (allParticipantsVoted() && 
          !isOpen && 
          !room.isResultsVisible && 
          modalShownForStory !== storyId) {
        setModalShownForStory(storyId);
        onOpen();
      }
    }, 500); // 500ms delay to ensure all votes are processed

    return () => clearTimeout(timer);
  }, [room?.currentStory?.votes, room?.currentStory?.id, isOpen, onOpen, currentUser?.role, room?.isResultsVisible, modalShownForStory]);

  // Reset modal state when new voting starts
  useEffect(() => {
    if (room?.isVotingActive && !room?.isResultsVisible && room?.currentStory) {
      setModalShownForStory(null);
    }
  }, [room?.isVotingActive, room?.isResultsVisible, room?.currentStory?.id]);

  useEffect(() => {
    if (!roomId || !isConnected) return;

    // Give some time for auto-rejoin to work before redirecting
    const timer = setTimeout(() => {
      // If user is not in a room after auto-rejoin attempt, redirect to join page
      if (isConnected && !currentUser && !error) {
        navigate(`/join/${roomId}`);
      }
    }, 2000); // Wait 2 seconds for auto-rejoin

    return () => clearTimeout(timer);
  }, [roomId, currentUser, isConnected, error, navigate]);

  const handleSelectCard = (value: FibonacciCardType) => {
    const currentVote = getCurrentUserVote();
    const isChangingVote = currentVote && currentVote !== value;
    
    submitVote(value);
    toast({
      title: isChangingVote ? 'Vote changed' : 'Vote submitted',
      description: 'You can change your vote anytime before results are revealed',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Get current user's vote if any
  const getCurrentUserVote = () => {
    if (!room?.currentStory || !currentUser) return undefined;
    const userVote = room.currentStory.votes.find((vote) => vote.userId === currentUser.id);
    return userVote?.value;
  };

  if (!isConnected) {
    return (
      <Center height="100vh">
        <Flex direction="column" align="center">
          <Spinner size="xl" mb={4} />
          <Text>Connecting to server...</Text>
        </Flex>
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Center mt={6}>
          <Button colorScheme="blue" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Center>
      </Container>
    );
  }

  if (!room || !currentUser) {
    return (
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  const isScrumMaster = currentUser.role === 'Scrum Master' || currentUser.role === 'Temporary Scrum Master';

  const handleRevealResults = () => {
    onClose();
    revealResults();
    toast({
      title: 'Results revealed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={6}>
      {/* Modal when all participants have voted */}
      <Modal isOpen={isOpen && !room.isResultsVisible} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>All Participants Have Voted</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>All team members have submitted their votes. You can now reveal the results.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleRevealResults}>
              Reveal Results
            </Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Room info */}
      <Flex justify="flex-end" align="flex-start" mb={6}>
        <RoomInfo roomId={room.id} />
      </Flex>

      <Grid
        templateColumns={{ base: '1fr', lg: '3fr 1fr' }}
        gap={6}
      >
        {/* Main Content */}
        <GridItem>
          <Flex direction="column" gap={6}>

            {room.currentStory ? (
              <CurrentStory
                story={room.currentStory}
                isVotingActive={room.isVotingActive}
              />
            ) : (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  {isScrumMaster
                    ? 'Add a story to start voting'
                    : 'Waiting for Scrum Master to add a story'}
                </AlertDescription>
              </Alert>
            )}

            {room.isResultsVisible && room.currentStory && votingStats && (
              <VotingResults
                stats={votingStats}
                totalVotes={room.currentStory.votes.length}
              />
            )}

            <Box mt={4}>
              <FibonacciDeck
                selectedValue={getCurrentUserVote()}
                onSelectCard={handleSelectCard}
                isVotingActive={room.isVotingActive}
                isResultsVisible={room.isResultsVisible}
              />
            </Box>
          </Flex>
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <Flex direction="column" gap={6}>
            <ParticipantsList
              users={room.users}
              votes={room.currentStory?.votes || []}
              isVotingActive={room.isVotingActive}
              isResultsVisible={room.isResultsVisible}
            />

            {isScrumMaster && (
              <ScrumMasterControls
                isVotingActive={room.isVotingActive}
                isResultsVisible={room.isResultsVisible}
                hasStory={Boolean(room.currentStory)}
              />
            )}
          </Flex>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default RoomPage;