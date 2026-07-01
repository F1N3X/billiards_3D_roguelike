import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { GameHistoryModule } from './game-history/game-history.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    GameHistoryModule,
    GameSessionsModule,
  ],
})
export class AppModule {}
