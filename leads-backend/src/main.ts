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

  // Global validation pipe with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true,            // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );
  
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();
