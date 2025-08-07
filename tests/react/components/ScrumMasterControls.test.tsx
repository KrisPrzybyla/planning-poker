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
    it('should have Reveal Results button available', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const revealButton = screen.getByText('Reveal Results');
      expect(revealButton).toBeInTheDocument();
    });

    it('should have Reset Voting button available', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const resetButton = screen.getByText('Reset Voting');
      expect(resetButton).toBeInTheDocument();
    });

    it('should have End Session button available', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const endButton = screen.getByText('End Session');
      expect(endButton).toBeInTheDocument();
    });
  });

  describe('Story Form Modal', () => {
    it('should have Add Voting button when no story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={false}
        />
      );

      const addButton = screen.getByText('Add Voting');
      expect(addButton).toBeInTheDocument();
    });

    it('should have New Voting button when story exists', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={false}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      const newButton = screen.getByText('New Voting');
      expect(newButton).toBeInTheDocument();
    });
  });

  describe('Component rendering', () => {
    it('should render component with all buttons', () => {
      renderWithChakra(
        <ScrumMasterControls
          isVotingActive={true}
          isResultsVisible={false}
          hasStory={true}
        />
      );

      expect(screen.getByText('New Voting')).toBeInTheDocument();
      expect(screen.getByText('Reveal Results')).toBeInTheDocument();
      expect(screen.getByText('Reset Voting')).toBeInTheDocument();
      expect(screen.getByText('End Session')).toBeInTheDocument();
    });
  });
});