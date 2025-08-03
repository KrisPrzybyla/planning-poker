import { Vote, VotingStats } from '../types';

/**
 * Calculates voting statistics from an array of votes
 * @param votes Array of votes to analyze
 * @returns VotingStats object with average, distribution and most frequent vote
 */
export const calculateVotingStats = (votes: Vote[]): VotingStats => {
  // Initialize stats object
  const stats: VotingStats = {
    average: null,
    distribution: {},
    mostFrequent: null,
  };

  // If no votes, return empty stats
  if (!votes.length) {
    return stats;
  }

  // Calculate distribution
  const distribution: Record<string, number> = {};
  let maxCount = 0;
  let mostFrequent: string | null = null;

  votes.forEach((vote) => {
    if (!distribution[vote.value]) {
      distribution[vote.value] = 0;
    }
    distribution[vote.value]++;

    // Track most frequent vote
    if (distribution[vote.value] > maxCount) {
      maxCount = distribution[vote.value];
      mostFrequent = vote.value;
    }
  });

  // Calculate percentages for distribution
  Object.keys(distribution).forEach((key) => {
    distribution[key] = Math.round((distribution[key] / votes.length) * 100);
  });

  // Calculate average (only for numeric values)
  const numericVotes = votes
    .filter((vote) => !isNaN(Number(vote.value)))
    .map((vote) => Number(vote.value));

  const average = numericVotes.length
    ? numericVotes.reduce((sum, value) => sum + value, 0) / numericVotes.length
    : null;

  return {
    average,
    distribution,
    mostFrequent,
  };
};

/**
 * Generates a random 6-character room code
 * @returns A unique room code
 */
export const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Formats a room code with proper spacing for display
 * @param code The room code to format
 * @returns Formatted room code
 */
export const formatRoomCode = (code: string): string => {
  return code.split('').join(' ');
};