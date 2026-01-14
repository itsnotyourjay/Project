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
        relations: ['user'],
        order: { createdAt: 'DESC' } 
      });
    }
    return this.leadsRepository.find({ 
      relations: ['user'],
      order: { createdAt: 'DESC' } 
    });
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

  // Get count of leads for a specific user
  async getLeadCountForUser(userId: number): Promise<number> {
    return this.leadsRepository.count({
      where: { userId },
    });
  }

  // Reassign a single lead to a different user
  async reassignSingleLead(
    leadId: number,
    toUserId: number,
  ): Promise<{ message: string; lead: Lead }> {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    const previousUserId = lead.userId;
    lead.userId = toUserId;
    await this.leadsRepository.save(lead);

    return {
      message: `Successfully reassigned lead ${leadId} from user ${previousUserId} to user ${toUserId}`,
      lead,
    };
  }

  // Reassign all leads from one user to another
  async reassignLeads(
    fromUserId: number,
    toUserId: number,
  ): Promise<{ count: number; message: string }> {
    // Find all leads belonging to the old user
    const leads = await this.leadsRepository.find({
      where: { userId: fromUserId },
    });

    if (leads.length === 0) {
      return { 
        count: 0, 
        message: `No leads found for user ${fromUserId}` 
      };
    }

    // Batch update all leads to new user
    await this.leadsRepository.update(
      { userId: fromUserId },
      { userId: toUserId },
    );

    return {
      count: leads.length,
      message: `Successfully reassigned ${leads.length} leads from user ${fromUserId} to user ${toUserId}`,
    };
  }

  // Find and reassign orphaned leads (leads belonging to deleted users)
  async reassignOrphanedLeads(
    defaultAdminId: number,
  ): Promise<{ count: number; message: string }> {
    // Find leads where the user is soft-deleted
    const orphanedLeads = await this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoin('lead.user', 'user')
      .where('user.deleted_at IS NOT NULL')
      .getMany();

    if (orphanedLeads.length === 0) {
      return {
        count: 0,
        message: 'No orphaned leads found',
      };
    }

    // Reassign all orphaned leads to the default admin
    const leadIds = orphanedLeads.map((l) => l.id);
    await this.leadsRepository.update(leadIds, { userId: defaultAdminId });

    return {
      count: orphanedLeads.length,
      message: `Reassigned ${orphanedLeads.length} orphaned leads to admin ${defaultAdminId}`,
    };
  }
}

