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
import { DealStatus } from '@prisma/client';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Deals')
@ApiBearerAuth()
@Controller('deals')
@UseGuards(AuthGuard('jwt'))
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created successfully' })
  create(@Body() createDealDto: CreateDealDto, @CurrentUser() user: any) {
    return this.dealsService.create(createDealDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DealStatus })
  @ApiQuery({ name: 'stageId', required: false })
  @ApiResponse({ status: 200, description: 'List of deals' })
  findAll(
    @CurrentUser() user: any,
    @Query('countryId') countryId?: string,
    @Query('status') status?: DealStatus,
    @Query('stageId') stageId?: string,
  ) {
    return this.dealsService.findAll(user, { countryId, status, stageId });
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get deals grouped by pipeline stages' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'Deals grouped by stage' })
  findByStage(
    @CurrentUser() user: any,
    @Query('countryId') countryId?: string,
  ) {
    return this.dealsService.findByStage(user, countryId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get deal statistics' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'Deal statistics' })
  getStatistics(
    @CurrentUser() user: any,
    @Query('countryId') countryId?: string,
  ) {
    return this.dealsService.getStatistics(user, countryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  @ApiResponse({ status: 200, description: 'Deal details' })
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deal' })
  @ApiResponse({ status: 200, description: 'Deal updated successfully' })
  update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move deal to different stage' })
  @ApiResponse({ status: 200, description: 'Deal moved successfully' })
  moveToStage(@Param('id') id: string, @Body() moveStageDto: MoveStageDto) {
    return this.dealsService.moveToStage(id, moveStageDto.stageId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal status (Won/Lost)' })
  @ApiResponse({ status: 200, description: 'Deal status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.dealsService.updateStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete deal' })
  @ApiResponse({ status: 200, description: 'Deal deleted successfully' })
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}
