/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { 
  calculateVotingStats, 
  generateRoomCode, 
  formatRoomCode 
} from '../votingUtils'
import { Vote } from '../../types'

describe('votingUtils', () => {
  const mockVotes: Vote[] = [
    { userId: 'user1', value: '5' },
    { userId: 'user2', value: '8' },
    { userId: 'user3', value: '3' },
    { userId: 'user4', value: '5' },
    { userId: 'user5', value: '?' }
  ]

  describe('calculateVotingStats', () => {
    it('should calculate voting statistics correctly', () => {
      const stats = calculateVotingStats(mockVotes)
      
      expect(stats).toHaveProperty('average')
      expect(stats).toHaveProperty('distribution')
      expect(stats).toHaveProperty('mostFrequent')
      
      // Average should be calculated from numeric votes only: (5+8+3+5)/4 = 5.25
      expect(stats.average).toBe(5.25)
      
      // Most frequent should be '5' (appears twice)
      expect(stats.mostFrequent).toBe('5')
      
      // Distribution should show percentages
      expect(stats.distribution).toHaveProperty('5')
      expect(stats.distribution).toHaveProperty('8')
      expect(stats.distribution).toHaveProperty('3')
      expect(stats.distribution).toHaveProperty('?')
    })

    it('should handle empty votes array', () => {
      const stats = calculateVotingStats([])
      
      expect(stats.average).toBeNull()
      expect(stats.distribution).toEqual({})
      expect(stats.mostFrequent).toBeNull()
    })

    it('should handle non-numeric votes only', () => {
      const nonNumericVotes: Vote[] = [
        { userId: 'user1', value: '?' },
        { userId: 'user2', value: '☕' },
        { userId: 'user3', value: '?' }
      ]
      
      const stats = calculateVotingStats(nonNumericVotes)
      
      expect(stats.average).toBeNull()
      expect(stats.mostFrequent).toBe('?')
      expect(stats.distribution['?']).toBe(67) // 2/3 = 67%
      expect(stats.distribution['☕']).toBe(33) // 1/3 = 33%
    })

    it('should calculate distribution percentages correctly', () => {
      const votes: Vote[] = [
        { userId: 'user1', value: '5' },
        { userId: 'user2', value: '5' },
        { userId: 'user3', value: '8' },
        { userId: 'user4', value: '8' }
      ]
      
      const stats = calculateVotingStats(votes)
      
      expect(stats.distribution['5']).toBe(50) // 2/4 = 50%
      expect(stats.distribution['8']).toBe(50) // 2/4 = 50%
    })
  })

  describe('generateRoomCode', () => {
    it('should generate a 6-character room code', () => {
      const code = generateRoomCode()
      
      expect(code).toHaveLength(6)
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })

    it('should generate different codes on multiple calls', () => {
      const code1 = generateRoomCode()
      const code2 = generateRoomCode()
      
      // While theoretically possible to be the same, it's extremely unlikely
      expect(code1).not.toBe(code2)
    })
  })

  describe('formatRoomCode', () => {
    it('should format room code with spaces', () => {
      const code = 'ABC123'
      const formatted = formatRoomCode(code)
      
      expect(formatted).toBe('A B C 1 2 3')
    })

    it('should handle empty string', () => {
      const formatted = formatRoomCode('')
      
      expect(formatted).toBe('')
    })

    it('should handle single character', () => {
      const formatted = formatRoomCode('A')
      
      expect(formatted).toBe('A')
    })
  })
})