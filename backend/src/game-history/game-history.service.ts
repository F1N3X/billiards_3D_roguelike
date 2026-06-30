import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { MONGO_DB } from '../database/database.module';
import { GameHistory } from './game-history.interface';
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

  async remove(id: string): Promise<void> {
    const result = await this.db
      .collection<GameHistory>(COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`GameHistory ${id} not found`);
    }
  }
}
