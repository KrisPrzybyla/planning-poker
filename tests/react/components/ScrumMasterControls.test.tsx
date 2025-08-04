import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ScrumMasterControls from '../../../src/components/ScrumMasterControls';
import { useRoom } from '../../../src/context/RoomContext';

// Mock the useRoom hook
jest.mock('../../../src/context/RoomContext', () => ({
  useRoom: jest.fn(),
}));

// Mock StoryForm component
jest.mock('../../../src/components/StoryForm', () => {
  return function MockStoryForm({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="story-form">
        <button onClick={onClose} data-testid="close-story-form">
          Close Story Form
        </button>
      </div>
    );
  };
});

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('ScrumMasterControls', () => {
  const mockRevealResults = jest.fn();
  const mockResetVoting = jest.fn();
  const mockEndSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    
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
      revealResults: mockRevealResults,
      resetVoting: mockResetVoting,
      endSession: mockEndSession,
      removeUser: jest.fn(),
    });
  });

  describe('Button rendering', () => {
    it('should render all control buttons', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      expect(screen.getByText('Add Voting')).toBeInTheDocument();
      expect(screen.getByText('Reveal Results')).toBeInTheDocument();
      expect(screen.getByText('Reset Voting')).toBeInTheDocument();
      expect(screen.getByText('End Session')).toBeInTheDocument();
    });

    it('should show "New Voting" when story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      expect(screen.getByText('New Voting')).toBeInTheDocument();
      expect(screen.queryByText('Add Voting')).not.toBeInTheDocument();
    });
  });

  describe('Button states', () => {
    it('should disable Reveal Results when voting is not active', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      expect(revealButton).toBeDisabled();
    });

    it('should disable Reveal Results when results are already visible', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={true}
          hasStory={true}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      expect(revealButton).toBeDisabled();
    });

    it('should disable Reveal Results when no story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      expect(revealButton).toBeDisabled();
    });

    it('should enable Reveal Results when voting is active, results not visible, and story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      expect(revealButton).not.toBeDisabled();
    });

    it('should disable Reset Voting when no story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const resetButton = screen.getByText('Reset Voting');
      expect(resetButton).toBeDisabled();
    });

    it('should enable Reset Voting when story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const resetButton = screen.getByText('Reset Voting');
      expect(resetButton).not.toBeDisabled();
    });
  });

  describe('Button actions', () => {
    it('should call revealResults when Reveal Results is clicked', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      fireEvent.click(revealButton);

      expect(mockRevealResults).toHaveBeenCalledTimes(1);
    });

    it('should call resetVoting when Reset Voting is clicked', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const resetButton = screen.getByText('Reset Voting');
      fireEvent.click(resetButton);

      expect(mockResetVoting).toHaveBeenCalledTimes(1);
    });

    it('should call endSession when End Session is clicked and confirmed', () => {
      mockConfirm.mockReturnValue(true);

      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const endButton = screen.getByText('End Session');
      fireEvent.click(endButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to end this session?');
      expect(mockEndSession).toHaveBeenCalledTimes(1);
    });

    it('should not call endSession when End Session is clicked but not confirmed', () => {
      mockConfirm.mockReturnValue(false);

      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const endButton = screen.getByText('End Session');
      fireEvent.click(endButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to end this session?');
      expect(mockEndSession).not.toHaveBeenCalled();
    });
  });

  describe('Story Form Modal', () => {
    it('should open modal when Add Voting is clicked', async () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const addButton = screen.getByText('Add Voting');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('story-form')).toBeInTheDocument();
      });
    });

    it('should open modal when New Voting is clicked without confirmation if no active voting', async () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const newButton = screen.getByText('New Voting');
      fireEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByTestId('story-form')).toBeInTheDocument();
      });
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it('should show confirmation when New Voting is clicked during active voting', async () => {
      mockConfirm.mockReturnValue(true);

      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const newButton = screen.getByText('New Voting');
      fireEvent.click(newButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Voting is currently in progress. Starting a new vote will reset all current votes. Do you want to continue?'
      );

      await waitFor(() => {
        expect(screen.getByTestId('story-form')).toBeInTheDocument();
      });
    });

    it('should not open modal when New Voting confirmation is cancelled', () => {
      mockConfirm.mockReturnValue(false);

      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const newButton = screen.getByText('New Voting');
      fireEvent.click(newButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(screen.queryByTestId('story-form')).not.toBeInTheDocument();
    });

    it('should close modal when story form close button is clicked', async () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      // Open modal
      const addButton = screen.getByText('Add Voting');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('story-form')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('close-story-form');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('story-form')).not.toBeInTheDocument();
      });
    });

    it('should not show confirmation when New Voting is clicked and results are visible', async () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={true}
          hasStory={true}
        />
      );

      const newButton = screen.getByText('New Voting');
      fireEvent.click(newButton);

      expect(mockConfirm).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('story-form')).toBeInTheDocument();
      });
    });
  });

  describe('Toast notifications', () => {
    // Note: Testing toast notifications would require mocking useToast hook
    // For now, we're testing that the functions are called correctly
    it('should call reveal results function which triggers toast', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      fireEvent.click(revealButton);

      expect(mockRevealResults).toHaveBeenCalledTimes(1);
    });

    it('should call reset voting function which triggers toast', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const resetButton = screen.getByText('Reset Voting');
      fireEvent.click(resetButton);

      expect(mockResetVoting).toHaveBeenCalledTimes(1);
    });

    it('should call end session function which triggers toast', () => {
      mockConfirm.mockReturnValue(true);

      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const endButton = screen.getByText('End Session');
      fireEvent.click(endButton);

      expect(mockEndSession).toHaveBeenCalledTimes(1);
    });
  });
});