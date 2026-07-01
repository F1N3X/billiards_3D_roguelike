import { GameMode } from '../game-history.interface';

export class CreateGameHistoryDto {
  sessionId: string;
  userId: string;
  gameMode: GameMode = 'classic';
  score: number;
  shots: number;
}
