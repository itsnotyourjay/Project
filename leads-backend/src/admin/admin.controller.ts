import { Controller, Get, Post, Patch, Delete, UseGuards, Query, Param, Body, NotFoundException } from '@nestjs/common';
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
    const users = await this.usersService.findAll();
    
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

  @Get('leads')
  async getAllLeads(@Query('userId') userId?: string, @Query('search') search?: string) {
    // Get all leads (no userId filter = admin view)
    const leads = await this.leadsService.findAll();
    
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
    const users = await this.usersService.findAll();
    const leads = await this.leadsService.findAll();
    
    return {
      totalUsers: users.length,
      totalLeads: leads.length,
      adminUsers: users.filter(u => u.isAdmin).length,
      regularUsers: users.filter(u => !u.isAdmin).length,
    };
  }

  // Get single user details with their leads
  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    const userId = parseInt(id);
    const user = await this.usersService.findById(userId);
    
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
      leadsCount: leads.length
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

  // Delete user
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const userId = parseInt(id);
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Get lead count before deletion
    const leads = await this.leadsService.findAll(userId);
    const leadCount = leads.length;
    
    // Delete the user (this will cascade to related data)
    await this.usersService.deleteUser(userId);
    
    return {
      message: 'User deleted successfully',
      deletedLeadsCount: leadCount
    };
  }
}
