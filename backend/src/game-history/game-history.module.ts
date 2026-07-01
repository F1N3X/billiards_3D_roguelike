import { Module } from '@nestjs/common';
import { GameHistoryController } from './game-history.controller';
import { GameHistoryService } from './game-history.service';
import { AuthModule } from '../auth/auth.module';
import { GameSessionsModule } from '../game-sessions/game-sessions.module';

@Module({
  imports: [AuthModule, GameSessionsModule],
  controllers: [GameHistoryController],
  providers: [GameHistoryService],
  exports: [GameHistoryService],
})
export class GameHistoryModule {}
