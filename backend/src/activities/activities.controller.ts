import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ActivityStatus } from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(AuthGuard('jwt'))
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  create(@Body() createActivityDto: CreateActivityDto, @CurrentUser() user: any) {
    return this.activitiesService.create(createActivityDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities' })
  @ApiQuery({ name: 'status', required: false, enum: ActivityStatus })
  @ApiQuery({ name: 'dealId', required: false })
  @ApiResponse({ status: 200, description: 'List of activities' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: ActivityStatus,
    @Query('dealId') dealId?: string,
  ) {
    return this.activitiesService.findAll(user, { status, dealId });
  }

  @Get('pending-count')
  @ApiOperation({ summary: 'Get pending activities count' })
  @ApiResponse({ status: 200, description: 'Pending activities count' })
  getPendingCount(@CurrentUser() user: any) {
    return this.activitiesService.getPendingCount(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity details' })
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update activity' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark activity as complete' })
  @ApiResponse({ status: 200, description: 'Activity marked as complete' })
  complete(@Param('id') id: string) {
    return this.activitiesService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
