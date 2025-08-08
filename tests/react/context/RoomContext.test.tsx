import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { RoomProvider, useRoom } from '../../../src/context/RoomContext';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
delete (window as any).location;
(window as any).location = {
  href: 'http://localhost:3000/',
  pathname: '/',
};

// Mock useHealthCheck hook to prevent act() warnings
jest.mock('../../../src/hooks/useHealthCheck', () => ({
  useHealthCheck: jest.fn(() => ({
    healthStatus: { status: 'healthy' },
    isHealthy: true,
    isUnhealthy: false,
    isChecking: false,
    manualCheck: jest.fn(),
    lastChecked: '2024-01-01T12:00:00.000Z'
  }))
}));

// Test component that uses the context
const TestComponent = () => {
  const {
    socket,
    room,
    currentUser,
    isConnected,
    error,
    votingStats,
    createRoom,
    joinRoom,
    startVoting,
    submitVote,
    revealResults,
    resetVoting,
    endSession,
    removeUser,
  } = useRoom();

  const handleCreateRoom = async () => {
    try {
      await createRoom('Test User');
    } catch (err) {
      // Error is already handled by setError in RoomContext
    }
  };

  const handleJoinRoom = async () => {
    try {
      await joinRoom('TEST123', 'Test User');
    } catch (err) {
      // Error is already handled by setError in RoomContext
    }
  };

  return (
    <div>
      <div data-testid="socket-status">{socket ? 'connected' : 'disconnected'}</div>
      <div data-testid="connection-status">{isConnected ? 'online' : 'offline'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="current-user">{currentUser?.name || 'no-user'}</div>
      <div data-testid="room-id">{room?.id || 'no-room'}</div>
      <div data-testid="voting-stats">{votingStats ? 'has-stats' : 'no-stats'}</div>
      <button onClick={handleCreateRoom} data-testid="create-room">
        Create Room
      </button>
      <button onClick={handleJoinRoom} data-testid="join-room">
        Join Room
      </button>
      <button onClick={() => startVoting({ title: 'Test Story', description: 'Test Description' })} data-testid="start-voting">
        Start Voting
      </button>
      <button onClick={() => submitVote('5')} data-testid="submit-vote">
        Submit Vote
      </button>
      <button onClick={() => revealResults()} data-testid="reveal-results">
        Reveal Results
      </button>
      <button onClick={() => resetVoting()} data-testid="reset-voting">
        Reset Voting
      </button>
      <button onClick={() => endSession()} data-testid="end-session">
        End Session
      </button>
      <button onClick={() => removeUser('user123')} data-testid="remove-user">
        Remove User
      </button>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      <RoomProvider>{component}</RoomProvider>
    </ChakraProvider>
  );
};

describe('RoomContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (window as any).location.pathname = '/';
    (window as any).location.href = '';
  });

  describe('Provider initialization', () => {
    it('should initialize with default values', () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('socket-status')).toHaveTextContent('connected');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('offline');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('current-user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('room-id')).toHaveTextContent('no-room');
      expect(screen.getByTestId('voting-stats')).toHaveTextContent('no-stats');
    });

    it('should restore user from localStorage', () => {
      const savedUser = { id: 'user1', name: 'Saved User', role: 'Participant' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedUser));

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('current-user')).toHaveTextContent('Saved User');
    });

    it('should set up socket event listeners', () => {
      renderWithProviders(<TestComponent />);

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('roomUpdated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('sessionEnded', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('scrumMasterChanged', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('userRemoved', expect.any(Function));
    });
  });

  describe('Socket events', () => {
    it('should handle connect event', async () => {
      renderWithProviders(<TestComponent />);

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('online');
      });
    });

    it('should handle disconnect event', async () => {
      renderWithProviders(<TestComponent />);

      // First connect
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectHandler();
      });

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      act(() => {
        disconnectHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('offline');
      });
    });

    it('should handle error event', async () => {
      renderWithProviders(<TestComponent />);

      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'error')[1];
      act(() => {
        errorHandler('Test error message');
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error message');
      });
    });

    it('should handle roomUpdated event', async () => {
      renderWithProviders(<TestComponent />);

      const mockRoom = {
        id: 'ROOM123',
        users: [],
        currentStory: null,
        isVotingActive: false,
        isResultsVisible: false,
        votingCount: 0,
      };

      const roomUpdatedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'roomUpdated')[1];
      act(() => {
        roomUpdatedHandler(mockRoom);
      });

      await waitFor(() => {
        expect(screen.getByTestId('room-id')).toHaveTextContent('ROOM123');
      });
    });

    it('should calculate voting stats when results are visible', async () => {
      renderWithProviders(<TestComponent />);

      const mockRoom = {
        id: 'ROOM123',
        users: [],
        currentStory: {
          id: 'story1',
          title: 'Test Story',
          description: '',
          votes: [
            { userId: 'user1', value: '5' },
            { userId: 'user2', value: '8' },
          ],
        },
        isVotingActive: false,
        isResultsVisible: true,
        votingCount: 1,
      };

      const roomUpdatedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'roomUpdated')[1];
      act(() => {
        roomUpdatedHandler(mockRoom);
      });

      await waitFor(() => {
        expect(screen.getByTestId('voting-stats')).toHaveTextContent('has-stats');
      });
    });
  });

  describe('Room actions', () => {
    it('should create room successfully', async () => {
      renderWithProviders(<TestComponent />);

      // Mock successful response
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'createRoom') {
          callback({
            success: true,
            roomId: 'ROOM123',
            user: { id: 'user1', name: 'Test User', role: 'Scrum Master' },
          });
        }
      });

      const createButton = screen.getByTestId('create-room');
      act(() => {
        createButton.click();
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith(
          'createRoom',
          { userName: 'Test User', initialStory: undefined },
          expect.any(Function)
        );
      });
    });

    it('should join room successfully', async () => {
      renderWithProviders(<TestComponent />);

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'joinRoom') {
          callback({
            success: true,
            user: { id: 'user2', name: 'Test User', role: 'Participant' },
          });
        }
      });

      const joinButton = screen.getByTestId('join-room');
      act(() => {
        joinButton.click();
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith(
          'joinRoom',
          { roomId: 'TEST123', userName: 'Test User' },
          expect.any(Function)
        );
      });
    });

    it('should handle room creation error', async () => {
      renderWithProviders(<TestComponent />);

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'createRoom') {
          callback({
            success: false,
            error: 'Failed to create room',
          });
        }
      });

      const createButton = screen.getByTestId('create-room');
      act(() => {
        createButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to create room');
      });
    });
  });

  describe('Voting actions', () => {
    let component: any;
    
    beforeEach(async () => {
      // Set up a mock room and user for voting tests
      component = renderWithProviders(<TestComponent />);
      
      const mockUser = { id: 'user1', name: 'Test User', role: 'Scrum Master', isConnected: true };
      const mockRoom = {
        id: 'ROOM123',
        users: [mockUser],
        currentStory: { id: 'story1', title: 'Test Story', votes: [], description: 'Test Description' },
        isVotingActive: true,
        isResultsVisible: false,
        votingCount: 1,
      };

      // First simulate successful room creation to set user
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'createRoom') {
          callback({
            success: true,
            roomId: 'ROOM123',
            user: mockUser,
          });
        }
      });

      const createButton = screen.getByTestId('create-room');
      act(() => {
        createButton.click();
      });

      // Wait for user to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent('Test User');
      });

      // Then simulate room update
      const roomUpdatedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'roomUpdated')[1];
      act(() => {
        roomUpdatedHandler(mockRoom);
      });

      // Clear previous mock calls
      mockSocket.emit.mockClear();
    });

    it('should start voting', () => {
      const startButton = screen.getByTestId('start-voting');
      act(() => {
        startButton.click();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'startVoting',
        { roomId: 'ROOM123', story: { title: 'Test Story', description: 'Test Description' } }
      );
    });

    it('should submit vote', () => {
      const voteButton = screen.getByTestId('submit-vote');
      act(() => {
        voteButton.click();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'submitVote',
        { roomId: 'ROOM123', userId: 'user1', value: '5' }
      );
    });

    it('should reveal results', () => {
      const revealButton = screen.getByTestId('reveal-results');
      act(() => {
        revealButton.click();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'revealResults',
        { roomId: 'ROOM123' }
      );
    });

    it('should reset voting', () => {
      const resetButton = screen.getByTestId('reset-voting');
      act(() => {
        resetButton.click();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'resetVoting',
        { roomId: 'ROOM123' }
      );
    });

    it('should end session', () => {
      const endButton = screen.getByTestId('end-session');
      act(() => {
        endButton.click();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'endSession',
        { roomId: 'ROOM123' }
      );
    });
  });

  describe('useRoom hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useRoom must be used within a RoomProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('localStorage integration', () => {
    it('should save user to localStorage when currentUser changes', async () => {
      renderWithProviders(<TestComponent />);

      const mockUser = { id: 'user1', name: 'Test User', role: 'Participant' };
      
      // Simulate user being set
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'createRoom') {
          callback({
            success: true,
            roomId: 'ROOM123',
            user: mockUser,
          });
        }
      });

      const createButton = screen.getByTestId('create-room');
      act(() => {
        createButton.click();
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'planningPoker_currentUser',
          JSON.stringify(mockUser)
        );
      });
    });

    it('should remove user from localStorage when currentUser is null', async () => {
      renderWithProviders(<TestComponent />);

      // Simulate session ended event
      const sessionEndedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'sessionEnded')[1];
      act(() => {
        sessionEndedHandler();
      });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('planningPoker_currentUser');
      });
    });
  });
});