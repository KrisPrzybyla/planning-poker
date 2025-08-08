import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ParticipantsList from '../../../src/components/ParticipantsList';
import { User, Vote } from '../../../src/types';

// Mock the useRoom hook
jest.mock('../../../src/context/RoomContext', () => ({
  useRoom: () => ({
    currentUser: { id: 'user1', role: 'Scrum Master' },
    removeUser: jest.fn(),
  }),
}));

// Mock data
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    role: 'Scrum Master',
    roomId: 'room1',
    isConnected: true
  },
  {
    id: 'user2', 
    name: 'Jane Smith',
    role: 'Participant',
    roomId: 'room1',
    isConnected: true
  },
  {
    id: 'user3',
    name: 'Bob Wilson',
    role: 'Participant',
    roomId: 'room1',
    isConnected: false
  }
];

const mockVotes: Vote[] = [
  {
    userId: 'user1',
    value: '5'
  },
  {
    userId: 'user3',
    value: '8'
  }
];

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('ParticipantsList', () => {
  it('renders all users correctly', () => {
    renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={false}
        isResultsVisible={true}
      />
    );
    
    // Check that user names are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('shows scrum master badge correctly', () => {
    renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={false}
        isResultsVisible={true}
      />
    );
    
    // Check for scrum master badge
    expect(screen.getByText('SM')).toBeInTheDocument();
  });

  it('shows offline status for disconnected users', () => {
    renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={false}
        isResultsVisible={true}
      />
    );
    
    // Check that offline status is shown for disconnected user
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });

  it('shows voting status during voting', () => {
    renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={true}
        isResultsVisible={false}
      />
    );
    
    // During voting, votes should be hidden
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows participant count correctly', () => {
    renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={false}
        isResultsVisible={true}
      />
    );
    
    // Check participant count
    expect(screen.getByText('Participants (3)')).toBeInTheDocument();
  });
});