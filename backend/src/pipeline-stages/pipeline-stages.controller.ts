import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PipelineStagesService } from './pipeline-stages.service';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@ApiTags('Pipeline Stages')
@ApiBearerAuth()
@Controller('pipeline-stages')
@UseGuards(AuthGuard('jwt'))
export class PipelineStagesController {
  constructor(private readonly pipelineStagesService: PipelineStagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pipeline stage' })
  @ApiResponse({ status: 201, description: 'Stage created successfully' })
  create(@Body() createPipelineStageDto: CreatePipelineStageDto) {
    return this.pipelineStagesService.create(createPipelineStageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pipeline stages' })
  @ApiResponse({ status: 200, description: 'List of pipeline stages' })
  findAll() {
    return this.pipelineStagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline stage by ID' })
  @ApiResponse({ status: 200, description: 'Pipeline stage details' })
  findOne(@Param('id') id: string) {
    return this.pipelineStagesService.findOne(id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder pipeline stages' })
  @ApiResponse({ status: 200, description: 'Stages reordered successfully' })
  reorder(@Body() reorderStagesDto: ReorderStagesDto) {
    return this.pipelineStagesService.reorder(reorderStagesDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pipeline stage' })
  @ApiResponse({ status: 200, description: 'Stage updated successfully' })
  update(@Param('id') id: string, @Body() updatePipelineStageDto: UpdatePipelineStageDto) {
    return this.pipelineStagesService.update(id, updatePipelineStageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete pipeline stage' })
  @ApiResponse({ status: 200, description: 'Stage deleted successfully' })
  remove(@Param('id') id: string) {
    return this.pipelineStagesService.remove(id);
  }
}
