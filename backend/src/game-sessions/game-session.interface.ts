import { ObjectId } from 'mongodb';

export type GameMode = 'classic' | 'rumble';

export interface GameSession {
  _id?: ObjectId;
  userId: ObjectId;
  gameMode: GameMode;
  startedAt: Date;
  expiresAt: Date;
  used: boolean;
}
