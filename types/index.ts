export interface User {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  createdAt: Date;
  pollCount: number;
  voteCount: number;
}

export interface Poll {
  pollId: string;
  authorUid: string;
  authorName: string;
  question: string;
  options: string[];
  voteCounts: number[] | { [key: string]: number };
  totalVotes: number;
  allowMultiple: boolean;
  status: 'active' | 'expired' | 'deleted';
  createdAt: Date;
  expiresAt: Date;
}

export interface Vote {
  optionIndex: number;
  votedAt: Date;
}