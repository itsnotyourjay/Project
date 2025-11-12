import { Controller, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result: any = await this.auth.register(dto, ipAddress);
    // set access and refresh tokens as secure HttpOnly cookies
    if (result?.access_token) {
      res.cookie('accessToken', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.ACCESS_EXPIRES_MS || String(15 * 60 * 1000)),
      });
    }
    if (result?.refresh_token) {
      res.cookie('refreshToken', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // default 7 days
        maxAge: parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000)),
      });
    }

    // return only user info; tokens are in HttpOnly cookies
    return { user: result.user };
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result: any = await this.auth.login(dto, ipAddress);
    
    if (result?.access_token) {
      res.cookie('accessToken', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.ACCESS_EXPIRES_MS || String(15 * 60 * 1000)),
      });
    }
    
    if (result?.refresh_token) {
      res.cookie('refreshToken', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000)),
      });
    }

    return { user: result.user };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies?.refreshToken;
    const tokens: any = await this.auth.refreshTokens(refreshToken);
    if (tokens?.access_token) {
      res.cookie('accessToken', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.ACCESS_EXPIRES_MS || String(15 * 60 * 1000)),
      });
    }
    if (tokens?.refresh_token) {
      res.cookie('refreshToken', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000)),
      });
    }

    return { user: (req as any).user || null };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.id;
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return this.auth.logout(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me')
  me(@Req() req: Request) {
    // returns the authenticated user (populated by JwtStrategy)
    return { user: (req as any).user };
  }
}
