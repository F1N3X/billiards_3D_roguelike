import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  pseudo: string;
}

@Controller('game-history')
export class GameHistoryController {
  constructor(private readonly gameHistoryService: GameHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Body() dto: CreateGameHistoryDto,
  ) {
    return this.gameHistoryService.create(dto, req.user.sub);
  }

  @Get()
  findAll() {
    return this.gameHistoryService.findAll();
  }

  @Get('leaderboard/:gameMode')
  getLeaderboard(@Param('gameMode') gameMode: string) {
    return this.gameHistoryService.getLeaderboard(gameMode);
  }

  @Get('stats/:userId/:gameMode')
  getPlayerStats(
    @Param('userId') userId: string,
    @Param('gameMode') gameMode: string,
  ) {
    return this.gameHistoryService.getPlayerStats(userId, gameMode);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.gameHistoryService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameHistoryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.gameHistoryService.remove(id);
  }
}
