import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'

// Polyfill for crypto.getRandomValues
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto
}

// Ensure getRandomValues is available
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (array: any) => webcrypto.getRandomValues(array)
}

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock Socket.IO client
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'mock-socket-id'
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}))

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id')
}))

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid')
}))

// Global test utilities
declare global {
  var mockSocket: any
}

global.mockSocket = mockSocket