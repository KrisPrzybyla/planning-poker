import { describe, it, expect } from 'vitest'
import { calculateVotingStats, generateRoomCode, formatRoomCode } from './utils/votingUtils'

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should generate room code', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^[A-Z0-9]+$/)
  })

  it('should format room code', () => {
    const formatted = formatRoomCode('ABC123')
    expect(formatted).toBe('A B C 1 2 3')
  })

  it('should calculate voting stats', () => {
    const votes = [
      { userId: 'user1', value: '5' },
      { userId: 'user2', value: '8' }
    ]
    
    const stats = calculateVotingStats(votes)
    expect(stats.average).toBe(6.5)
    expect(stats.distribution).toHaveProperty('5')
    expect(stats.distribution).toHaveProperty('8')
  })
})