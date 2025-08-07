import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoomPage from '../../../src/pages/RoomPage';
import { useRoom } from '../../../src/context/RoomContext';
import { Room, User, Story, Vote } from '../../../src/types';

// Mock the useRoom hook
jest.mock('../../../src/context/RoomContext', () => ({
  useRoom: jest.fn(),
}));

// Mock all child components
jest.mock('../../../src/components/FibonacciDeck', () => {
  return function MockFibonacciDeck({ 
    selectedValue, 
    onSelectCard, 
    isVotingActive, 
    isResultsVisible 
  }: any) {
    return (
      <div data-testid="fibonacci-deck">
        <div data-testid="deck-selected-value">{selectedValue || 'none'}</div>
        <div data-testid="deck-voting-active">{isVotingActive ? 'true' : 'false'}</div>
        <div data-testid="deck-results-visible">{isResultsVisible ? 'true' : 'false'}</div>
        <button onClick={() => onSelectCard('5')} data-testid="card-5">5</button>
        <button onClick={() => onSelectCard('8')} data-testid="card-8">8</button>
      </div>
    );
  };
});

jest.mock('../../../src/components/RoomInfo', () => {
  return function MockRoomInfo({ roomId }: { roomId: string }) {
    return <div data-testid="room-info">Room: {roomId}</div>;
  };
});

jest.mock('../../../src/components/ParticipantsList', () => {
  return function MockParticipantsList({ users, votes, isVotingActive, isResultsVisible }: any) {
    return (
      <div data-testid="participants-list">
        <div data-testid="participants-users-count">{users.length}</div>
        <div data-testid="participants-votes-count">{votes.length}</div>
        <div data-testid="participants-voting-active">{isVotingActive ? 'true' : 'false'}</div>
        <div data-testid="participants-results-visible">{isResultsVisible ? 'true' : 'false'}</div>
      </div>
    );
  };
});

jest.mock('../../../src/components/CurrentStory', () => {
  return function MockCurrentStory({ story, isVotingActive }: any) {
    return (
      <div data-testid="current-story">
        <div data-testid="story-title">{story.title}</div>
        <div data-testid="story-voting-active">{isVotingActive ? 'true' : 'false'}</div>
      </div>
    );
  };
});

jest.mock('../../../src/components/VotingResults', () => {
  return function MockVotingResults({ stats, totalVotes }: any) {
    return (
      <div data-testid="voting-results">
        <div data-testid="results-total-votes">{totalVotes}</div>
        <div data-testid="results-average">{stats.average}</div>
      </div>
    );
  };
});

jest.mock('../../../src/components/ScrumMasterControls', () => {
  return function MockScrumMasterControls({ isVotingActive, isResultsVisible, hasStory }: any) {
    return (
      <div data-testid="scrum-master-controls">
        <div data-testid="controls-voting-active">{isVotingActive ? 'true' : 'false'}</div>
        <div data-testid="controls-results-visible">{isResultsVisible ? 'true' : 'false'}</div>
        <div data-testid="controls-has-story">{hasStory ? 'true' : 'false'}</div>
      </div>
    );
  };
});

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ roomId: 'test-room' }),
}));

const mockToast = jest.fn();

// Mock Chakra UI toast
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

const renderWithProviders = (roomId: string = 'test-room') => {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[`/room/${roomId}`]}>
        <Routes>
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
};

describe('RoomPage', () => {
  const mockSubmitVote = jest.fn();
  const mockRevealResults = jest.fn();

  const mockUser: User = {
    id: 'user1',
    name: 'Test User',
    role: 'Participant',
    roomId: 'test-room',
    isConnected: true,
  };

  const mockScrumMaster: User = {
    id: 'sm1',
    name: 'Scrum Master',
    role: 'Scrum Master',
    roomId: 'test-room',
    isConnected: true,
  };

  const mockStory: Story = {
    id: 'story1',
    title: 'Test Story',
    description: 'Test Description',
    votes: [],
  };

  const mockRoom: Room = {
    id: 'test-room',
    users: [mockUser, mockScrumMaster],
    currentStory: mockStory,
    isVotingActive: false,
    isResultsVisible: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseRoom.mockReturnValue({
      socket: null,
      room: mockRoom,
      currentUser: mockUser,
      isConnected: true,
      error: null,
      votingStats: null,
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
      startVoting: jest.fn(),
      submitVote: mockSubmitVote,
      revealResults: mockRevealResults,
      resetVoting: jest.fn(),
      endSession: jest.fn(),
      removeUser: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading states', () => {
    it('should show connecting spinner when not connected', () => {
      mockUseRoom.mockReturnValue({
        socket: null,
        room: null,
        currentUser: null,
        isConnected: false,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: jest.fn(),
        revealResults: jest.fn(),
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Connecting to server...')).toBeInTheDocument();
    });


  });

  describe('Error handling', () => {
    it('should show error message when there is an error', () => {
      mockUseRoom.mockReturnValue({
        socket: null,
        room: null,
        currentUser: null,
        isConnected: true,
        error: 'Connection failed',
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: jest.fn(),
        revealResults: jest.fn(),
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    it('should navigate to home when back button is clicked', () => {
      mockUseRoom.mockReturnValue({
        socket: null,
        room: null,
        currentUser: null,
        isConnected: true,
        error: 'Connection failed',
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: jest.fn(),
        revealResults: jest.fn(),
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      const backButton = screen.getByText('Back to Home');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Room content rendering', () => {
    it('should render room page with all components for participant', () => {
      renderWithProviders();

      expect(screen.getByTestId('room-info')).toBeInTheDocument();
      expect(screen.getByTestId('current-story')).toBeInTheDocument();
      expect(screen.getByTestId('fibonacci-deck')).toBeInTheDocument();
      expect(screen.getByTestId('participants-list')).toBeInTheDocument();
      expect(screen.queryByTestId('scrum-master-controls')).not.toBeInTheDocument();
    });

    it('should render scrum master controls for scrum master', () => {
      mockUseRoom.mockReturnValue({
        socket: null,
        room: mockRoom,
        currentUser: mockScrumMaster,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      expect(screen.getByTestId('scrum-master-controls')).toBeInTheDocument();
    });

    it('should show waiting message when no story exists for participant', () => {
      const roomWithoutStory = { ...mockRoom, currentStory: null };
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithoutStory,
        currentUser: mockUser,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Waiting for Scrum Master to add a story')).toBeInTheDocument();
    });

    it('should show add story message when no story exists for scrum master', () => {
      const roomWithoutStory = { ...mockRoom, currentStory: null };
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithoutStory,
        currentUser: mockScrumMaster,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Add a story to start voting')).toBeInTheDocument();
    });
  });

  describe('Voting functionality', () => {
    it('should handle card selection and show toast', () => {
      const roomWithVoting = { 
        ...mockRoom, 
        isVotingActive: true,
        currentStory: {
          ...mockStory,
          votes: []
        }
      };
      
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithVoting,
        currentUser: mockUser,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      const card5 = screen.getByTestId('card-5');
      fireEvent.click(card5);

      expect(mockSubmitVote).toHaveBeenCalledWith('5');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Vote submitted',
        description: 'You can change your vote anytime before results are revealed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    it('should show vote changed toast when changing vote', () => {
      const roomWithVoting = { 
        ...mockRoom, 
        isVotingActive: true,
        currentStory: {
          ...mockStory,
          votes: [{ userId: 'user1', value: '3' }]
        }
      };
      
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithVoting,
        currentUser: mockUser,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      const card8 = screen.getByTestId('card-8');
      fireEvent.click(card8);

      expect(mockSubmitVote).toHaveBeenCalledWith('8');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Vote changed',
        description: 'You can change your vote anytime before results are revealed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    it('should show voting results when results are visible', () => {
      const roomWithResults = { 
        ...mockRoom, 
        isVotingActive: false,
        isResultsVisible: true,
        currentStory: {
          ...mockStory,
          votes: [
            { userId: 'user1', value: '5' },
            { userId: 'sm1', value: '8' }
          ]
        }
      };
      
      const mockStats = {
        average: 6.5,
        distribution: { '5': 50, '8': 50 },
        mostFrequent: null
      };

      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithResults,
        currentUser: mockUser,
        isConnected: true,
        error: null,
        votingStats: mockStats,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      expect(screen.getByTestId('voting-results')).toBeInTheDocument();
      expect(screen.getByTestId('results-total-votes')).toHaveTextContent('2');
      expect(screen.getByTestId('results-average')).toHaveTextContent('6.5');
    });
  });

  describe('All participants voted modal', () => {
    it('should show modal when all participants have voted (Scrum Master)', async () => {
      const roomWithAllVotes = { 
        ...mockRoom, 
        isVotingActive: true,
        isResultsVisible: false,
        currentStory: {
          ...mockStory,
          votes: [
            { userId: 'user1', value: '5' },
            { userId: 'sm1', value: '8' }
          ]
        }
      };
      
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithAllVotes,
        currentUser: mockScrumMaster,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      // Fast-forward the timer
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByText('All Participants Have Voted')).toBeInTheDocument();
      });

      expect(screen.getByText('All team members have submitted their votes. You can now reveal the results.')).toBeInTheDocument();
    });

    it('should not show modal for participants', async () => {
      const roomWithAllVotes = { 
        ...mockRoom, 
        isVotingActive: true,
        isResultsVisible: false,
        currentStory: {
          ...mockStory,
          votes: [
            { userId: 'user1', value: '5' },
            { userId: 'sm1', value: '8' }
          ]
        }
      };
      
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithAllVotes,
        currentUser: mockUser,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      // Fast-forward the timer
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.queryByText('All Participants Have Voted')).not.toBeInTheDocument();
      });
    });

    it('should handle reveal results from modal', async () => {
      const roomWithAllVotes = { 
        ...mockRoom, 
        isVotingActive: true,
        isResultsVisible: false,
        currentStory: {
          ...mockStory,
          votes: [
            { userId: 'user1', value: '5' },
            { userId: 'sm1', value: '8' }
          ]
        }
      };
      
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithAllVotes,
        currentUser: mockScrumMaster,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      // Fast-forward the timer
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(screen.getByText('All Participants Have Voted')).toBeInTheDocument();
      });

      const revealButton = screen.getByText('Reveal Results');
      fireEvent.click(revealButton);

      expect(mockRevealResults).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Results revealed',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    });
  });

  describe('Navigation and auto-rejoin', () => {
    it('should redirect to join page after timeout when user not in room', async () => {
      mockUseRoom.mockReturnValue({
        socket: null,
        room: null,
        currentUser: null,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: jest.fn(),
        revealResults: jest.fn(),
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders('test-room');

      // Fast-forward the auto-rejoin timer
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/join/test-room');
      });
    });

    it('should not redirect when user is in room', async () => {
      renderWithProviders('test-room');

      // Fast-forward the auto-rejoin timer
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      // Wait a bit to ensure no navigation happens
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Component props passing', () => {
    it('should pass correct props to child components', () => {
      const roomWithVoting = { 
        ...mockRoom, 
        isVotingActive: true,
        isResultsVisible: false,
        currentStory: {
          ...mockStory,
          votes: [{ userId: 'user1', value: '5' }]
        }
      };
      
      mockUseRoom.mockReturnValue({
        socket: null,
        room: roomWithVoting,
        currentUser: mockUser,
        isConnected: true,
        error: null,
        votingStats: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        startVoting: jest.fn(),
        submitVote: mockSubmitVote,
        revealResults: mockRevealResults,
        resetVoting: jest.fn(),
        endSession: jest.fn(),
        removeUser: jest.fn(),
      });

      renderWithProviders();

      // Check FibonacciDeck props
      expect(screen.getByTestId('deck-selected-value')).toHaveTextContent('5');
      expect(screen.getByTestId('deck-voting-active')).toHaveTextContent('true');
      expect(screen.getByTestId('deck-results-visible')).toHaveTextContent('false');

      // Check ParticipantsList props
      expect(screen.getByTestId('participants-users-count')).toHaveTextContent('2');
      expect(screen.getByTestId('participants-votes-count')).toHaveTextContent('1');

      // Check CurrentStory props
      expect(screen.getByTestId('story-title')).toHaveTextContent('Test Story');
      expect(screen.getByTestId('story-voting-active')).toHaveTextContent('true');
    });
  });
});