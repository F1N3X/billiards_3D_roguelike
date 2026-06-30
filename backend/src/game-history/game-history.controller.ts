import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';

@Controller('game-history')
export class GameHistoryController {
  constructor(private readonly gameHistoryService: GameHistoryService) {}

  @Post()
  create(@Body() dto: CreateGameHistoryDto) {
    return this.gameHistoryService.create(dto);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.gameHistoryService.remove(id);
  }
}
