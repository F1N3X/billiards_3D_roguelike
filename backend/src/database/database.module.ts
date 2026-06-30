import { Module, Global, Inject, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';

export const MONGO_CLIENT = 'MONGO_CLIENT';
export const MONGO_DB = 'MONGO_DB';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MONGO_CLIENT,
      useFactory: async (config: ConfigService): Promise<MongoClient> => {
        const uri = config.getOrThrow<string>('MONGODB_URI');
        const client = new MongoClient(uri);
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: MONGO_DB,
      useFactory: (client: MongoClient): Db => {
        return client.db('billiards');
      },
      inject: [MONGO_CLIENT],
    },
  ],
  exports: [MONGO_CLIENT, MONGO_DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
