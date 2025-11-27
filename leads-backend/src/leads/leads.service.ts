import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

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

  async update(id: number, updateLeadDto: UpdateLeadDto, userId?: number) {
    // First, verify the lead exists and belongs to the user
    const lead = await this.findOne(id, userId);
    
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found or access denied`);
    }

    // Update the lead with new data
    Object.assign(lead, updateLeadDto);
    await this.leadsRepository.save(lead);
    
    return { msg: 'Lead updated successfully', data: lead };
  }

  async remove(id: number, userId?: number) {
    // First, verify the lead exists and belongs to the user
    const lead = await this.findOne(id, userId);
    
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found or access denied`);
    }

    await this.leadsRepository.remove(lead);
    
    return { msg: 'Lead deleted successfully' };
  }
}
