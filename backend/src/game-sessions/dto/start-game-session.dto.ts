import { GameMode } from '../game-session.interface';

export class StartGameSessionDto {
  gameMode: GameMode = 'classic';
}
