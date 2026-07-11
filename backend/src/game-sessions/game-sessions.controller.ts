import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { StartGameSessionDto } from './dto/start-game-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  pseudo: string;
}

@Controller('game-sessions')
export class GameSessionsController {
  constructor(private readonly gameSessionsService: GameSessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  start(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Body() dto: StartGameSessionDto,
  ) {
    return this.gameSessionsService.start(req.user.sub, dto);
  }
}
