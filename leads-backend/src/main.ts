import { randomUUID } from 'crypto';

// Polyfill for global.crypto if missing
if (!global.crypto) {
  global.crypto = { randomUUID } as any;
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors(); // frontend integration thru CORS

  // Set global API prefix
  app.setGlobalPrefix('api');

  console.log('PORT:', process.env.PORT);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);
  
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
