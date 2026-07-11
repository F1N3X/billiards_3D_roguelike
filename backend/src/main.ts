import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins: (string | RegExp)[] = [/^http:\/\/localhost:\d+$/];
  if (process.env.CORS_ORIGIN) {
    const origins = process.env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    allowedOrigins.push(...origins);
  }
  app.enableCors({ origin: allowedOrigins });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
