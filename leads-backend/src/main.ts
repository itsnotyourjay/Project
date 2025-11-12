import { randomUUID } from 'crypto';

// Polyfill for global.crypto if missing
if (!global.crypto) {
  global.crypto = { randomUUID } as any;
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  // parse cookies for refresh-token flow
  app.use(cookieParser());

  // Allow frontend integration, Authorization header and cookies (for refresh tokens)
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || true,
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  console.log('PORT:', process.env.PORT);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
