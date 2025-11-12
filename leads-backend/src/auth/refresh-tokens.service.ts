import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserToken } from './entities/user-token.entity';

@Injectable()
export class RefreshTokensService {
  constructor(@InjectRepository(UserToken) private repo: Repository<UserToken>) {}

  async create(data: Partial<UserToken>): Promise<UserToken> {
    const row = this.repo.create(data);
    return this.repo.save(row);
  }

  async findById(id: string): Promise<UserToken | undefined> {
    return this.repo.findOne({ where: { id } });
  }

  async findValidForUser(userId: number): Promise<UserToken[]> {
    return this.repo.find({ where: { user_id: userId, revoked: false } });
  }

  async revoke(tokenId: string): Promise<void> {
    await this.repo.update(tokenId, { revoked: true } as Partial<UserToken>);
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.repo.update({ user_id: userId }, { revoked: true } as Partial<UserToken>);
  }

  async markUsed(id: string): Promise<void> {
    // user_tokens entity doesn't have last_used_at field; use updated_at via update
    await this.repo.update(id, { updated_at: new Date() } as Partial<UserToken>);
  }

  async setReplacedBy(oldId: string, newId: string): Promise<void> {
    await this.repo.update(oldId, { replaced_by: newId } as Partial<UserToken>);
  }

  async update(id: string, patch: Partial<UserToken>): Promise<void> {
    await this.repo.update(id, patch);
  }
}
