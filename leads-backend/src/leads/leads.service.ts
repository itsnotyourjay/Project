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

  async create(createLeadDto: CreateLeadDto) {
    const lead = this.leadsRepository.create(createLeadDto);
    await this.leadsRepository.save(lead);
    return { msg: 'Lead created successfully', data: lead };
  }

  async findAll() {
    return this.leadsRepository.find();
  }

  async findOne(id: number) {
    return this.leadsRepository.findOneBy({ id });
  }
}
