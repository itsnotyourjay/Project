import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { UserToken } from './entities/user-token.entity';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokensService } from './refresh-tokens.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, UserToken]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.ACCESS_EXPIRES_IN || '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, RefreshTokensService],
  controllers: [AuthController],
})
export class AuthModule {}
