import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  async create(createLeadDto: CreateLeadDto, userId?: number) {
    const lead = this.leadsRepository.create(createLeadDto);
    if (userId) {
      // associate lead with the submitting user
      (lead as any).userId = userId;
    }
    await this.leadsRepository.save(lead);
    return { msg: 'Lead created successfully', data: lead };
  }

  async findAll(userId?: number) {
    // If userId is provided, filter by that user. Otherwise return all (for admin scenarios)
    if (userId) {
      return this.leadsRepository.find({ 
        where: { userId },
        order: { createdAt: 'DESC' } 
      });
    }
    return this.leadsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number, userId?: number) {
    // If userId is provided, ensure the lead belongs to that user
    if (userId) {
      return this.leadsRepository.findOne({ 
        where: { id, userId } 
      });
    }
    return this.leadsRepository.findOne(id);
  }
}
