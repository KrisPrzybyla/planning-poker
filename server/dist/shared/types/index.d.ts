export type FibonacciCard = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | '☕';
export interface User {
    id: string;
    name: string;
    role: 'scrum-master' | 'participant';
    isConnected: boolean;
}
export interface Vote {
    userId: string;
    card: FibonacciCard | null;
    timestamp: number;
}
export interface Room {
    id: string;
    name: string;
    scrumMasterId: string;
    users: User[];
    currentStory: string;
    votes: Vote[];
    isVotingActive: boolean;
    isRevealed: boolean;
    createdAt: number;
}
export interface RoomStats {
    totalVotes: number;
    averagePoints: number;
    consensus: boolean;
    mostCommonVote: FibonacciCard | null;
}
export interface ServerToClientEvents {
    'room-updated': (room: Room) => void;
    'user-joined': (user: User) => void;
    'user-left': (userId: string) => void;
    'voting-started': (story: string) => void;
    'voting-ended': () => void;
    'votes-revealed': (stats: RoomStats) => void;
    'votes-reset': () => void;
    'error': (message: string) => void;
}
export interface ClientToServerEvents {
    'join-room': (roomId: string, userName: string) => void;
    'create-room': (roomName: string, userName: string) => void;
    'start-voting': (story: string) => void;
    'cast-vote': (card: FibonacciCard) => void;
    'reveal-votes': () => void;
    'reset-votes': () => void;
    'end-voting': () => void;
}
//# sourceMappingURL=index.d.ts.map