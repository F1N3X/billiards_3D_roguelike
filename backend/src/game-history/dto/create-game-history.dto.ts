import { GameMode } from '../game-history.interface';

export class CreateGameHistoryDto {
  userId: string;
  gameMode: GameMode = 'classic';
  score: number;
  shots: number;
}
