import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';


@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    const userId = req?.user?.id;
    return this.leadsService.create(createLeadDto, userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Request() req: any) {
    // req.user is set by JwtStrategy.validate
    const userId = req?.user?.id;
    return this.leadsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id;
    return this.leadsService.findOne(+id, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Request() req: any) {
    const userId = req?.user?.id;
    return this.leadsService.update(+id, updateLeadDto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id;
    return this.leadsService.remove(+id, userId);
  }
}
