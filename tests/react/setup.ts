import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.scrollTo to silence jsdom "Not implemented: window.scrollTo" warnings
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

// Mock Socket.IO client
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
  id: 'mock-socket-id'
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id')
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

// Global test utilities
// mockSocket is available through the mock