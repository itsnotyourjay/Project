import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  // Accept an optional ipAddress to record where the user registered from
  async create(dto: RegisterUserDto, ipAddress?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      email: dto.email,
      password: hashedPassword,
      registeredIp: ipAddress ?? null,
    });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | undefined> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.repo.find({
      order: { registeredAt: 'DESC' }
    });
  }

  // Added method used by AuthService to record last login time and IP
  async updateLastLogin(userId: number, ipAddress?: string): Promise<void> {
    await this.repo.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress ?? null,
    } as Partial<User>);
  }

  // Store hashed refresh token for a user (used for refresh token rotation)
  // Legacy single-token method removed — refresh tokens are stored in refresh_tokens table now.

  // Admin: Update user details (e.g., toggle admin status)
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    await this.repo.update(userId, updates);
    return this.findById(userId);
  }

  // Admin: Delete user (hard delete - removes user and cascades to related data)
  async deleteUser(userId: number): Promise<void> {
    await this.repo.delete(userId);
  }
}
