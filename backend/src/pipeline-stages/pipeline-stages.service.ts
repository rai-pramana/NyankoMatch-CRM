import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@Injectable()
export class PipelineStagesService {
  constructor(private prisma: PrismaService) {}

  async create(createPipelineStageDto: CreatePipelineStageDto) {
    // Get the highest order number
    const lastStage = await this.prisma.pipelineStage.findFirst({
      orderBy: { order: 'desc' },
    });

    const newOrder = lastStage ? lastStage.order + 1 : 1;

    return this.prisma.pipelineStage.create({
      data: {
        name: createPipelineStageDto.name,
        order: createPipelineStageDto.order ?? newOrder,
      },
    });
  }

  async findAll() {
    return this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id },
      include: {
        deals: true,
      },
    });

    if (!stage) {
      throw new NotFoundException('Pipeline stage not found');
    }

    return stage;
  }

  async update(id: string, updatePipelineStageDto: UpdatePipelineStageDto) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id },
    });

    if (!stage) {
      throw new NotFoundException('Pipeline stage not found');
    }

    return this.prisma.pipelineStage.update({
      where: { id },
      data: updatePipelineStageDto,
    });
  }

  async reorder(reorderStagesDto: ReorderStagesDto) {
    const updates = reorderStagesDto.stages.map((stage, index) =>
      this.prisma.pipelineStage.update({
        where: { id: stage.id },
        data: { order: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll();
  }

  async remove(id: string) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id },
      include: { _count: { select: { deals: true } } },
    });

    if (!stage) {
      throw new NotFoundException('Pipeline stage not found');
    }

    if (stage._count.deals > 0) {
      throw new NotFoundException(
        'Cannot delete stage with existing deals. Move deals to another stage first.',
      );
    }

    await this.prisma.pipelineStage.delete({
      where: { id },
    });

    return { message: 'Pipeline stage deleted successfully' };
  }
}
