export interface User {
  id: string;
  name: string;
  role: 'Scrum Master' | 'Participant';
  roomId: string;
}

export interface Room {
  id: string;
  users: User[];
  currentStory: Story | null;
  isVotingActive: boolean;
  isResultsVisible: boolean;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  votes: Vote[];
}

export interface Vote {
  userId: string;
  value: string;
}

export type FibonacciCard = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | '☕';

export interface VotingStats {
  average: number | null;
  distribution: Record<string, number>;
  mostFrequent: string | null;
}