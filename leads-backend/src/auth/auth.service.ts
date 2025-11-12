import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { RefreshTokensService } from './refresh-tokens.service';
import { UserToken } from './entities/user-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private refreshTokensService: RefreshTokensService,
  ) {}

  private async getTokens(userId: number, email: string) {
    const access_token = await this.jwt.signAsync({ sub: userId, email }, { expiresIn: process.env.ACCESS_EXPIRES_IN || '15m' });
    const refresh_token = await this.jwt.signAsync({ sub: userId }, { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' });
    return { access_token, refresh_token };
  }

  async register(dto: RegisterUserDto, ipAddress?: string) {
    const user = await this.users.create(dto, ipAddress);

    const tokens = await this.getTokens(user.id, user.email);

    // store hashed refresh token in refresh_tokens table
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
  await this.refreshTokensService.create({ user_id: user.id, token_hash: hashed, expires_at: new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000)))) });

    return { user: { id: user.id, email: user.email }, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async login(dto: LoginUserDto, ipAddress?: string) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    
    // this is where the last login is updated
    await this.users.updateLastLogin(user.id, ipAddress);
    const tokens = await this.getTokens(user.id, user.email);

    // store hashed refresh token in refresh_tokens table
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
  await this.refreshTokensService.create({ user_id: user.id, token_hash: hashed, expires_at: new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000)))) });

    return { user: { id: user.id, email: user.email }, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async logout(userId: number) {
  await this.refreshTokensService.revokeAllForUser(userId);
  }

  async refreshTokens(refreshToken: string) {
    try {
  const payload: any = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_SECRET });
      const userId = payload.sub as number;
      const user = await this.users.findById(userId);
      if (!user) throw new UnauthorizedException('Invalid refresh token');

      // find candidate tokens for this user and compare hashes
      const candidates = await this.refreshTokensService.findValidForUser(userId);
  let matched: UserToken | undefined;
      for (const c of candidates) {
        const ok = await bcrypt.compare(refreshToken, c.token_hash);
        if (ok && !c.revoked && (!c.expires_at || c.expires_at.getTime() > Date.now())) {
          matched = c;
          break;
        }
      }

      if (!matched) throw new UnauthorizedException('Invalid refresh token');

      // mark old token revoked and create a new one (rotation)
  await this.refreshTokensService.revoke(matched.id);
      const tokens = await this.getTokens(user.id, user.email);
      const hashed = await bcrypt.hash(tokens.refresh_token, 10);
  const newRow = await this.refreshTokensService.create({ user_id: user.id, token_hash: hashed, expires_at: new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000)))) });

  // link the rotation chain
  await this.refreshTokensService.setReplacedBy(matched.id, newRow.id);

      return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
