import { ObjectId } from 'mongodb';

export type GameMode = 'classic' | 'rumble';

export interface GameHistory {
  _id?: ObjectId;
  userId: ObjectId;
  gameMode: GameMode;
  score: number;
  shots: number;
  playedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  pseudo: string;
  score: number;
  shots: number;
  rankingScore: number;
}

export interface PlayerStats {
  avgScore: number;
  avgShots: number;
  bestScore: number;
  gamesCount: number;
}
