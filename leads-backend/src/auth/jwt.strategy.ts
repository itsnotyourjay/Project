import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

function cookieExtractor(req: any) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['accessToken'];
  }
  return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private users: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is required');
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) throw new UnauthorizedException();
    // Fetch user from database to get latest isAdmin status
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    
    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }
}
