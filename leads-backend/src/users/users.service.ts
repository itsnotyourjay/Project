import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) public repo: Repository<User>) {}
  // Made repo public so AdminController can access it for withDeleted queries

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

  // Get all users INCLUDING soft-deleted (for admin dashboard)
  async findAllIncludingDeleted(): Promise<User[]> {
    return this.repo.find({
      withDeleted: true,
      order: { registeredAt: 'DESC' }
    });
  }

  // Get only deleted users (for audit/recovery view)
  async findDeleted(): Promise<User[]> {
    return this.repo
      .createQueryBuilder('user')
      .where('user.deleted_at IS NOT NULL')
      .withDeleted()
      .orderBy('user.deleted_at', 'DESC')
      .getMany();
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

  // Admin: Soft delete user (mark as deleted, preserve data for audit)
  async softDeleteUser(
    userId: number,
    deletedBy: number,
    reason?: string,
  ): Promise<{ message: string; deletedUser: User }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Set deletion metadata before soft delete
    await this.repo.update(userId, {
      deleted_by: deletedBy,
      deletion_reason: reason || 'No reason provided',
    } as Partial<User>);

    // Perform soft delete (sets deleted_at timestamp)
    await this.repo.softDelete(userId);

    // Fetch the deleted user with deleted data
    const deletedUser = await this.repo.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    return {
      message: `User ${user.email} has been soft deleted`,
      deletedUser,
    };
  }

  // Admin: Restore a soft-deleted user
  async restoreUser(userId: number): Promise<User> {
    await this.repo.restore(userId);

    // Clear deletion metadata
    await this.repo.update(userId, {
      deleted_by: null,
      deletion_reason: null,
    } as Partial<User>);

    return this.findById(userId);
  }

  // Admin: Hard delete user (PERMANENT - use with extreme caution!)
  async deleteUser(userId: number): Promise<void> {
    const user = await this.repo.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Permanently remove from database
    await this.repo.remove(user);
  }
}
