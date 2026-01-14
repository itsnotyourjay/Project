import { Controller, Get, Post, Patch, Delete, UseGuards, Query, Param, Body, NotFoundException, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from '../users/users.service';
import { LeadsService } from '../leads/leads.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(
    private usersService: UsersService,
    private leadsService: LeadsService,
  ) {}

  @Get('users')
  async getAllUsers(@Query('search') search?: string) {
    // Admin ALWAYS sees all users (including deleted)
    const users = await this.usersService.findAllIncludingDeleted();
    
    // Filter by search query if provided
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Remove sensitive password field
    return filteredUsers.map(({ password, ...user }) => user);
  }

  @Get('users/deleted/list')
  async getDeletedUsers() {
    const deletedUsers = await this.usersService.findDeleted();
    // Remove sensitive password field
    return deletedUsers.map(({ password, ...user }) => user);
  }

  @Get('leads')
  async getAllLeads(@Query('userId') userId?: string, @Query('search') search?: string) {
    // Get all leads with user relations (including deleted users)
    const leadsRepo = this.leadsService['leadsRepository'];
    const leads = await leadsRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    
    // Manually load deleted users for leads
    for (const lead of leads) {
      if (lead.userId && !lead.user) {
        // User might be soft-deleted, fetch with withDeleted
        const deletedUser = await this.usersService.repo.findOne({
          where: { id: lead.userId },
          withDeleted: true,
        });
        if (deletedUser) {
          lead.user = deletedUser;
        }
      }
    }
    
    // Filter by userId if provided
    let filteredLeads = leads;
    if (userId) {
      filteredLeads = leads.filter(lead => lead.userId === parseInt(userId));
    }
    
    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.msg.toLowerCase().includes(searchLower)
      );
    }
    
    return filteredLeads;
  }

  @Get('stats')
  async getStats() {
    // Get all users including deleted for complete stats
    const allUsers = await this.usersService.findAllIncludingDeleted();
    const leads = await this.leadsService.findAll();
    
    // Calculate user statistics
    const activeUsers = allUsers.filter(u => !u.deleted_at);
    const deletedUsers = allUsers.filter(u => u.deleted_at);
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      deletedUsers: deletedUsers.length,
      totalLeads: leads.length,
      adminUsers: activeUsers.filter(u => u.isAdmin).length,
      regularUsers: activeUsers.filter(u => !u.isAdmin).length,
    };
  }

  // Get single user details with their leads
  // Get single user details with their leads (including if deleted)
  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    const userId = parseInt(id);
    
    // Find user including if they're soft-deleted
    const user = await this.usersService.repo.findOne({
      where: { id: userId },
      withDeleted: true,
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Get all leads submitted by this user
    const leads = await this.leadsService.findAll(userId);
    
    // Remove sensitive password field
    const { password, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      leads: leads,
      leadsCount: leads.length,
      isDeleted: !!user.deleted_at,
    };
  }

  // Update user (e.g., toggle admin status)
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() updates: { isAdmin?: boolean }) {
    const userId = parseInt(id);
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Only allow updating isAdmin field for now
    const allowedUpdates: any = {};
    if (typeof updates.isAdmin === 'boolean') {
      allowedUpdates.isAdmin = updates.isAdmin;
    }
    
    const updatedUser = await this.usersService.updateUser(userId, allowedUpdates);
    
    // Remove sensitive password field
    const { password, ...userWithoutPassword } = updatedUser;
    
    return {
      message: 'User updated successfully',
      user: userWithoutPassword
    };
  }

  // Delete user (soft delete with optional lead reassignment)
  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @Req() req,
    @Body() body?: { reason?: string; reassignTo?: number },
  ) {
    const userId = parseInt(id);
    const adminId = req.user?.id; // Get admin who is deleting
    
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Get lead count before deletion
    const leadCount = await this.leadsService.getLeadCountForUser(userId);
    
    // If leads exist and reassignTo is provided, reassign them
    let reassignResult = null;
    if (leadCount > 0 && body?.reassignTo) {
      reassignResult = await this.leadsService.reassignLeads(
        userId,
        body.reassignTo,
      );
    }
    
    // Soft delete the user
    const deleteResult = await this.usersService.softDeleteUser(
      userId,
      adminId,
      body?.reason,
    );
    
    return {
      message: deleteResult.message,
      deletedUser: deleteResult.deletedUser,
      leadCount,
      leadsReassigned: reassignResult ? reassignResult.count : 0,
      reassignedTo: body?.reassignTo || null,
    };
  }

  // Restore a soft-deleted user
  @Post('users/:id/restore')
  async restoreUser(@Param('id') id: string) {
    const userId = parseInt(id);
    
    const restoredUser = await this.usersService.restoreUser(userId);
    
    // Remove sensitive password field
    const { password, ...userWithoutPassword } = restoredUser;
    
    return {
      message: `User ${restoredUser.email} has been restored`,
      user: userWithoutPassword,
    };
  }

  // Hard delete user (PERMANENT - for extreme cases only)
  @Delete('users/:id/permanent')
  async hardDeleteUser(@Param('id') id: string, @Req() req) {
    const userId = parseInt(id);
    const adminId = req.user?.id;
    
    console.warn(
      `⚠️ PERMANENT DELETE: Admin ${adminId} is permanently deleting user ${userId}`,
    );
    
    await this.usersService.deleteUser(userId);
    
    return {
      message: `User with ID ${userId} has been permanently deleted`,
      warning: 'This action cannot be undone',
    };
  }

  // Reassign a single lead to a different user
  @Post('leads/reassign-single')
  async reassignSingleLead(
    @Body() body: { leadId: number; toUserId: number },
  ) {
    if (!body.leadId || !body.toUserId) {
      throw new BadRequestException(
        'Both leadId and toUserId are required',
      );
    }
    
    const result = await this.leadsService.reassignSingleLead(
      body.leadId,
      body.toUserId,
    );
    
    return result;
  }

  // Reassign all leads from one user to another (bulk operation)
  @Post('leads/reassign')
  async reassignLeads(
    @Body() body: { fromUserId: number; toUserId: number },
  ) {
    if (!body.fromUserId || !body.toUserId) {
      throw new BadRequestException(
        'Both fromUserId and toUserId are required',
      );
    }
    
    const result = await this.leadsService.reassignLeads(
      body.fromUserId,
      body.toUserId,
    );
    
    return result;
  }

  // Assign all orphaned leads to a default admin
  @Post('leads/assign-orphaned')
  async assignOrphanedLeads(@Body() body: { defaultAdminId: number }) {
    if (!body.defaultAdminId) {
      throw new BadRequestException('defaultAdminId is required');
    }
    
    const result = await this.leadsService.reassignOrphanedLeads(
      body.defaultAdminId,
    );
    
    return result;
  }
}
