import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [UsersModule, LeadsModule],
  controllers: [AdminController],
})
export class AdminModule {}
