import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { MONGO_DB } from '../database/database.module';
import {
  GameHistory,
  LeaderboardEntry,
  PlayerStats,
} from './game-history.interface';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';
import { GameSessionsService } from '../game-sessions/game-sessions.service';

const COLLECTION = 'game_history';

@Injectable()
export class GameHistoryService {
  private readonly logger = new Logger(GameHistoryService.name);

  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly gameSessionsService: GameSessionsService,
  ) {}

  async create(
    dto: CreateGameHistoryDto,
    userId: string,
  ): Promise<GameHistory> {
    const gameMode = dto.gameMode ?? 'classic';

    this.logger.log(
      `[create] sessionId=${dto.sessionId} jwtUserId=${userId} bodyUserId=${dto.userId} gameMode=${gameMode} score=${dto.score} shots=${dto.shots}`,
    );

    await this.gameSessionsService.consumeAndValidate(
      dto.sessionId,
      userId,
      gameMode,
      dto.score,
      dto.shots,
    );

    const entry: GameHistory = {
      userId: new ObjectId(dto.userId),
      gameMode,
      score: dto.score,
      shots: dto.shots,
      playedAt: new Date(),
    };

    const result = await this.db
      .collection<GameHistory>(COLLECTION)
      .insertOne(entry);

    this.logger.log(
      `[create] inserted _id=${result.insertedId.toString()} into db="${this.db.databaseName}" collection="${COLLECTION}"`,
    );

    return { ...entry, _id: result.insertedId };
  }

  async findAll(): Promise<GameHistory[]> {
    return this.db.collection<GameHistory>(COLLECTION).find().toArray();
  }

  async findByUser(userId: string): Promise<GameHistory[]> {
    return this.db
      .collection<GameHistory>(COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ playedAt: -1 })
      .toArray();
  }

  async findOne(id: string): Promise<GameHistory> {
    const entry = await this.db
      .collection<GameHistory>(COLLECTION)
      .findOne({ _id: new ObjectId(id) });

    if (!entry) {
      throw new NotFoundException(`GameHistory ${id} not found`);
    }
    return entry;
  }

  async getLeaderboard(gameMode: string): Promise<LeaderboardEntry[]> {
    const entries = await this.db
      .collection<GameHistory>(COLLECTION)
      .aggregate([
        { $match: { gameMode } },
        {
          $addFields: {
            rankingScore: {
              $cond: [
                { $gt: ['$shots', 0] },
                { $divide: ['$score', '$shots'] },
                0,
              ],
            },
          },
        },
        { $sort: { rankingScore: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            pseudo: '$user.pseudo',
            score: 1,
            shots: 1,
            rankingScore: { $round: ['$rankingScore', 1] },
          },
        },
      ])
      .toArray();

    return entries.map((e, i) => ({
      ...(e as Omit<LeaderboardEntry, 'rank'>),
      rank: i + 1,
    }));
  }

  async getPlayerStats(
    userId: string,
    gameMode: string,
  ): Promise<PlayerStats | null> {
    const [result] = await this.db
      .collection<GameHistory>(COLLECTION)
      .aggregate([
        { $match: { userId: new ObjectId(userId), gameMode } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$score' },
            avgShots: { $avg: '$shots' },
            bestScore: { $max: '$score' },
            gamesCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            avgScore: { $round: ['$avgScore', 0] },
            avgShots: { $round: ['$avgShots', 1] },
            bestScore: 1,
            gamesCount: 1,
          },
        },
      ])
      .toArray();

    return (result as PlayerStats) ?? null;
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .collection<GameHistory>(COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`GameHistory ${id} not found`);
    }
  }
}
