import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { MONGO_DB } from '../database/database.module';
import { GameSession, GameMode } from './game-session.interface';
import { StartGameSessionDto } from './dto/start-game-session.dto';

const COLLECTION = 'game_sessions';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 heures

// Classic : 15 boules fixes, score max = 15 boules en 1 coup (6 750) + bonus rapidité (1 900) = 8 650 → plafond 9 000.
// Rumble  : clone_on_contact crée des boules persistantes entre les tirs → croissance exponentielle (15×2ⁿ boules après n tirs).
//           Aucun plafond de score n'est défendable mathématiquement. La protection repose uniquement sur le token de session
//           (single-use, lié au JWT, TTL 2h). Pas de vérification de score pour ce mode.
const MAX_SCORE: Partial<Record<GameMode, number>> = {
  classic: 9_000,
};

@Injectable()
export class GameSessionsService {
  constructor(@Inject(MONGO_DB) private readonly db: Db) {}

  async start(userId: string, dto: StartGameSessionDto): Promise<{ sessionId: string }> {
    const now = new Date();
    const session: GameSession = {
      userId: new ObjectId(userId),
      gameMode: dto.gameMode ?? 'classic',
      startedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      used: false,
    };

    const result = await this.db.collection<GameSession>(COLLECTION).insertOne(session);
    return { sessionId: result.insertedId.toString() };
  }

  async consumeAndValidate(
    sessionId: string,
    userId: string,
    expectedGameMode: GameMode,
    score: number,
    shots: number,
  ): Promise<void> {
    let oid: ObjectId;
    try {
      oid = new ObjectId(sessionId);
    } catch {
      throw new BadRequestException('Invalid sessionId');
    }

    const session = await this.db
      .collection<GameSession>(COLLECTION)
      .findOne({ _id: oid });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    if (session.userId.toString() !== userId) {
      throw new ForbiddenException('Session does not belong to this user');
    }

    if (session.used) {
      throw new BadRequestException('Session already used');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Session expired');
    }

    if (session.gameMode !== expectedGameMode) {
      throw new BadRequestException('Game mode mismatch');
    }

    if (shots < 1) {
      throw new BadRequestException('Invalid shots count');
    }

    const maxScore = MAX_SCORE[expectedGameMode];
    if (maxScore !== undefined && score > maxScore) {
      throw new UnauthorizedException(`Score exceeds maximum allowed (${maxScore})`);
    }

    await this.db
      .collection<GameSession>(COLLECTION)
      .updateOne({ _id: oid }, { $set: { used: true } });
  }
}
