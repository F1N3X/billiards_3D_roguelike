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
