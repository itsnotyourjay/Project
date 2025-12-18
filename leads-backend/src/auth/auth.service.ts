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

  private async getTokens(userId: number, email: string, isAdmin: boolean = false) {
    const access_token = await this.jwt.signAsync({ sub: userId, email, isAdmin }, { expiresIn: process.env.ACCESS_EXPIRES_IN || '15m' });
    const refresh_token = await this.jwt.signAsync({ sub: userId, isAdmin }, { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' });
    return { access_token, refresh_token };
  }

  async register(dto: RegisterUserDto, ipAddress?: string) {
    const user = await this.users.create(dto, ipAddress);

    const tokens = await this.getTokens(user.id, user.email, user.isAdmin || false);

    // store hashed refresh token in refresh_tokens table
    console.log('💾 [REGISTER] Storing refresh token for new user:', user.id);
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000))));
    
    try {
      await this.refreshTokensService.create({ 
        user_id: user.id, 
        token_hash: hashed, 
        expires_at: expiresAt 
      });
      console.log('✅ [REGISTER] Refresh token saved successfully!');
    } catch (error) {
      console.error('❌ [REGISTER] Failed to save refresh token:', error.message);
      // Don't throw - allow registration to proceed
    }

    return { user: { id: user.id, email: user.email }, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async login(dto: LoginUserDto, ipAddress?: string) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    
    // this is where the last login is updated
    await this.users.updateLastLogin(user.id, ipAddress);
    const tokens = await this.getTokens(user.id, user.email, user.isAdmin || false);

    // store hashed refresh token in refresh_tokens table
    console.log('💾 Storing refresh token for user:', user.id);
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000))));
    console.log('📅 Refresh token will expire at:', expiresAt);
    
    try {
      const savedToken = await this.refreshTokensService.create({ 
        user_id: user.id, 
        token_hash: hashed, 
        expires_at: expiresAt 
      });
      console.log('✅ Refresh token saved successfully! ID:', savedToken.id);
    } catch (error) {
      console.error('❌ Failed to save refresh token:', error.message);
      console.error('Full error:', error);
      // Don't throw - allow login to proceed even if token storage fails
      // This prevents login from breaking while we debug the token storage issue
    }

    return { user: { id: user.id, email: user.email, isAdmin: user.isAdmin }, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async adminLogin(dto: LoginUserDto, ipAddress?: string) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    // Check if user is admin
    if (!user.isAdmin) throw new UnauthorizedException('Access denied. Admin privileges required.');
    
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    
    // Update last login
    await this.users.updateLastLogin(user.id, ipAddress);
    const tokens = await this.getTokens(user.id, user.email, true);

    // Store hashed refresh token
    console.log('💾 [ADMIN] Storing refresh token for user:', user.id);
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
    const expiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000))));
    console.log('📅 [ADMIN] Refresh token will expire at:', expiresAt);
    
    try {
      const savedToken = await this.refreshTokensService.create({ 
        user_id: user.id, 
        token_hash: hashed, 
        expires_at: expiresAt 
      });
      console.log('✅ [ADMIN] Refresh token saved successfully! ID:', savedToken.id);
    } catch (error) {
      console.error('❌ [ADMIN] Failed to save refresh token:', error.message);
      console.error('Full error:', error);
      // Don't throw - allow login to proceed even if token storage fails
      // This prevents login from breaking while we debug the token storage issue
    }

    return { user: { id: user.id, email: user.email, isAdmin: user.isAdmin }, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async logout(userId: number) {
  await this.refreshTokensService.revokeAllForUser(userId);
  }

  async refreshTokens(refreshToken: string) {
    try {
      console.log('🔄 Refreshing tokens...');
      const payload: any = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_SECRET });
      const userId = payload.sub as number;
      console.log('👤 User ID from refresh token:', userId);
      
      const user = await this.users.findById(userId);
      if (!user) {
        console.error('❌ User not found for ID:', userId);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // find candidate tokens for this user and compare hashes
      const candidates = await this.refreshTokensService.findValidForUser(userId);
      console.log('🔍 Found', candidates.length, 'valid token(s) for user');
      
      let matched: UserToken | undefined;
      for (const c of candidates) {
        const ok = await bcrypt.compare(refreshToken, c.token_hash);
        if (ok && !c.revoked && (!c.expires_at || c.expires_at.getTime() > Date.now())) {
          matched = c;
          break;
        }
      }

      if (!matched) {
        console.error('❌ No matching refresh token found in database');
        throw new UnauthorizedException('Invalid refresh token');
      }

      console.log('✅ Refresh token validated! Generating new tokens...');
      
      // mark old token revoked and create a new one (rotation)
      await this.refreshTokensService.revoke(matched.id);
      const tokens = await this.getTokens(user.id, user.email, user.isAdmin || false);
      const hashed = await bcrypt.hash(tokens.refresh_token, 10);
      const newRow = await this.refreshTokensService.create({ 
        user_id: user.id, 
        token_hash: hashed, 
        expires_at: new Date(Date.now() + (parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000))))
      });

      // link the rotation chain
      await this.refreshTokensService.setReplacedBy(matched.id, newRow.id);

      console.log('✅ Token refresh successful! New token ID:', newRow.id);
      return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
    } catch (e) {
      console.error('❌ Token refresh failed:', e.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
