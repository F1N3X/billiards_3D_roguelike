import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { MONGO_DB } from '../database/database.module';
import { User } from './user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';

const COLLECTION = 'users';
const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @Inject(MONGO_DB) private readonly db: Db,
    private readonly jwtService: JwtService,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.db
      .collection<User>(COLLECTION)
      .findOne({ email: dto.email });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const now = new Date();
    const user: User = {
      pseudo: dto.pseudo,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.db.collection<User>(COLLECTION).insertOne(user);
    const { passwordHash: _, ...safeUser } = {
      ...user,
      _id: result.insertedId,
    };
    return safeUser;
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.db
      .collection<User>(COLLECTION)
      .find({}, { projection: { passwordHash: 0 } })
      .toArray();
    return users;
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.db
      .collection<User>(COLLECTION)
      .findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const patch: Partial<User> = { updatedAt: new Date() };

    if (dto.pseudo) patch.pseudo = dto.pseudo;
    if (dto.email) patch.email = dto.email;
    if (dto.password) {
      patch.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const result = await this.db
      .collection<User>(COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: patch },
        { returnDocument: 'after', projection: { passwordHash: 0 } },
      );

    if (!result) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return result;
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = await this.db
      .collection<User>(COLLECTION)
      .findOne({ email: dto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = this.jwtService.sign({
      sub: safeUser._id.toString(),
      email: safeUser.email,
      pseudo: safeUser.pseudo,
    });
    return { user: safeUser, token };
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .collection<User>(COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
