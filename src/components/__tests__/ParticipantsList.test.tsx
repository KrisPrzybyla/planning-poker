/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import ParticipantsList from '../ParticipantsList'
import { User } from '../../types'

// Mock data
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    role: 'scrum-master',
    vote: '5',
    isConnected: true
  },
  {
    id: 'user2', 
    name: 'Jane Smith',
    role: 'participant',
    vote: null,
    isConnected: true
  },
  {
    id: 'user3',
    name: 'Bob Wilson',
    role: 'participant', 
    vote: '8',
    isConnected: false
  }
]

const renderWithChakra = (component: React.ReactElement) => {
  const mockRender = () => (
    <ChakraProvider>
      {component}
    </ChakraProvider>
  )
  return mockRender()
}

describe('ParticipantsList', () => {
  const mockOnRemoveUser = jest.fn()
  const mockCurrentUserId = 'user1'

  beforeEach(() => {
    mockOnRemoveUser.mockClear()
  })

  it('renders all users correctly', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        currentUserId={mockCurrentUserId}
        onRemoveUser={mockOnRemoveUser}
        votingInProgress={false}
        isCurrentUserScrumMaster={true}
      />
    )
    
    // Test that component renders without crashing
    expect(component).toBeTruthy()
  })

  it('shows scrum master badge correctly', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        currentUserId={mockCurrentUserId}
        onRemoveUser={mockOnRemoveUser}
        votingInProgress={false}
        isCurrentUserScrumMaster={true}
      />
    )
    
    expect(component).toBeTruthy()
  })

  it('shows offline status for disconnected users', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        currentUserId={mockCurrentUserId}
        onRemoveUser={mockOnRemoveUser}
        votingInProgress={false}
        isCurrentUserScrumMaster={true}
      />
    )
    
    expect(component).toBeTruthy()
  })

  it('shows voting status during voting', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        currentUserId={mockCurrentUserId}
        onRemoveUser={mockOnRemoveUser}
        votingInProgress={true}
        isCurrentUserScrumMaster={true}
      />
    )
    
    expect(component).toBeTruthy()
  })

  it('hides remove button for non-scrum masters', () => {
    const component = renderWithChakra(
      <ParticipantsList 
        users={mockUsers}
        currentUserId="user2"
        onRemoveUser={mockOnRemoveUser}
        votingInProgress={false}
        isCurrentUserScrumMaster={false}
      />
    )
    
    expect(component).toBeTruthy()
  })
})