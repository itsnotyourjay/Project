import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsModule } from './leads/leads.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    //loads the environment variables from .env
    ConfigModule.forRoot({ isGlobal: true}),

    // Rate limiting - prevent brute force attacks
    ThrottlerModule.forRoot([{
      ttl: 60000,      // Time window in milliseconds (60 seconds)
      limit: 10,       // Max 10 requests per 60 seconds per IP
    }]),

    //DB connection using TypeORM + env variables
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD') || '',
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        timezone: 'Z', // Force UTC timezone for all database operations
        dateStrings: false, // Return Date objects, not strings
      }),

    }),

  LeadsModule,
  UsersModule,
  AuthModule,
  AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
