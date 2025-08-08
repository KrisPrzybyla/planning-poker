import { Server } from 'socket.io'
import { createServer } from 'http'

// Global test setup for backend tests
beforeAll(() => {
  // Setup global test environment
})

afterAll(() => {
  // Cleanup after all tests
})

beforeEach(() => {
  // Reset state before each test
})

afterEach(() => {
  // Cleanup after each test
})

// Helper function to create test server
export const createTestServer = () => {
  const httpServer = createServer()
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })
  
  return { httpServer, io }
}

// Mock data
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  role: 'participant' as const,
  vote: null,
  isConnected: true
}

export const mockRoom = {
  id: 'test-room-id',
  name: 'Test Room',
  users: [mockUser],
  currentStory: null,
  votingInProgress: false,
  scrumMasterId: 'test-user-id'
}