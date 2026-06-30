import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { MONGO_DB } from '../database/database.module';
import { GameHistory, LeaderboardEntry, PlayerStats } from './game-history.interface';
import { CreateGameHistoryDto } from './dto/create-game-history.dto';

const COLLECTION = 'game_history';

@Injectable()
export class GameHistoryService {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}

  async create(dto: CreateGameHistoryDto): Promise<GameHistory> {
    const entry: GameHistory = {
      userId: new ObjectId(dto.userId),
      gameMode: dto.gameMode ?? 'classic',
      score: dto.score,
      shots: dto.shots,
      playedAt: new Date(),
    };

    const result = await this.db
      .collection<GameHistory>(COLLECTION)
      .insertOne(entry);

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
          $group: {
            _id: '$userId',
            avgScore: { $avg: '$score' },
            avgShots: { $avg: '$shots' },
            gamesCount: { $sum: 1 },
          },
        },
        {
          $addFields: {
            rankingScore: {
              $cond: [
                { $gt: ['$avgShots', 0] },
                { $divide: ['$avgScore', '$avgShots'] },
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
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            pseudo: '$user.pseudo',
            avgScore: { $round: ['$avgScore', 0] },
            avgShots: { $round: ['$avgShots', 1] },
            rankingScore: { $round: ['$rankingScore', 1] },
            gamesCount: 1,
          },
        },
      ])
      .toArray();

    return entries.map((e, i) => ({ ...(e as Omit<LeaderboardEntry, 'rank'>), rank: i + 1 }));
  }

  async getPlayerStats(userId: string, gameMode: string): Promise<PlayerStats | null> {
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
