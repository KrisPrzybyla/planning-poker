import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Flex,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import { useRoom } from '../context/RoomContext';
import FibonacciDeck from '../components/FibonacciDeck';
import RoomInfo from '../components/RoomInfo';
import ParticipantsList from '../components/ParticipantsList';
import CurrentStory from '../components/CurrentStory';
import VotingResults from '../components/VotingResults';
import ScrumMasterControls from '../components/ScrumMasterControls';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import VotingCompleteModal from '../components/VotingCompleteModal';
import { useVotingModal } from '../hooks/useVotingModal';
import { useAutoRedirect } from '../hooks/useAutoRedirect';
import { useVoting } from '../hooks/useVoting';
import { GRID_BREAKPOINTS, TOAST_DURATIONS } from '../constants';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    room,
    currentUser,
    isConnected,
    error,
    votingStats,
    submitVote,
    revealResults,
  } = useRoom();

  // Custom hooks
  const { isOpen, onClose } = useVotingModal({ room, currentUser });
  useAutoRedirect({ roomId, currentUser, isConnected, error });
  const { getCurrentUserVote, handleSelectCard } = useVoting({ room, currentUser, submitVote });

  // Handle different loading and error states
  if (!isConnected) {
    return <LoadingSpinner message="Connecting to server..." />;
  }

  if (error) {
    return <ErrorAlert error={error} onBackToHome={() => navigate('/')} />;
  }

  if (!room || !currentUser) {
    return <LoadingSpinner />;
  }

  const isScrumMaster = currentUser.role === 'Scrum Master' || currentUser.role === 'Temporary Scrum Master';

  const handleRevealResults = () => {
    onClose();
    revealResults();
    toast({
      title: 'Results revealed',
      status: 'info',
      duration: TOAST_DURATIONS.SHORT,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={6}>
      {/* Modal when all participants have voted */}
      <VotingCompleteModal
        isOpen={isOpen && !room.isResultsVisible}
        onClose={onClose}
        onRevealResults={handleRevealResults}
      />

      {/* Room info */}
      <Flex justify="flex-end" align="flex-start" mb={6}>
        <RoomInfo roomId={room.id} />
      </Flex>

      <Grid
        templateColumns={GRID_BREAKPOINTS.LAYOUT}
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