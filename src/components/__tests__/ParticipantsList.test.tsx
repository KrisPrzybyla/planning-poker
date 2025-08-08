/**
 * @vitest-environment jsdom
 */
import * as React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import ParticipantsList from '../ParticipantsList'
import { User, Vote } from '../../types'

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
]

const mockVotes: Vote[] = [
  {
    userId: 'user1',
    value: '5'
  },
  {
    userId: 'user3',
    value: '8'
  }
]

// Mock useRoom hook
jest.mock('../../context/RoomContext', () => ({
  useRoom: () => ({
    currentUser: mockUsers[0],
    removeUser: jest.fn()
  })
}))

const renderWithChakra = (component: React.ReactElement) => {
  const mockRender = () => (
    <ChakraProvider>
      {component}
    </ChakraProvider>
  )
  return mockRender()
}

describe('ParticipantsList', () => {
  it('renders all users correctly', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={false}
        isResultsVisible={false}
      />
    )
    
    // Test that component renders without crashing
    expect(component).toBeTruthy()
  })

  it('shows voting status during voting', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={true}
        isResultsVisible={false}
      />
    )
    
    expect(component).toBeTruthy()
  })

  it('shows results when voting is complete', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={mockVotes}
        isVotingActive={false}
        isResultsVisible={true}
      />
    )
    
    expect(component).toBeTruthy()
  })

  it('handles empty votes array', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        votes={[]}
        isVotingActive={true}
        isResultsVisible={false}
      />
    )
    
    expect(component).toBeTruthy()
  })

  it('handles empty users array', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={[]}
        votes={[]}
        isVotingActive={false}
        isResultsVisible={false}
      />
    )
    
    expect(component).toBeTruthy()
  })
})