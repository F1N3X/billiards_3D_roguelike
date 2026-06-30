import { ObjectId } from 'mongodb';

export type GameMode = 'classic';

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
  avgScore: number;
  avgShots: number;
  rankingScore: number;
  gamesCount: number;
}

export interface PlayerStats {
  avgScore: number;
  avgShots: number;
  bestScore: number;
  gamesCount: number;
}
