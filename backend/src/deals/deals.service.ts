import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, DealStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(createDealDto: CreateDealDto, userId: string) {
    return this.prisma.deal.create({
      data: {
        name: createDealDto.name,
        value: createDealDto.value,
        probability: createDealDto.probability,
        expectedCloseDate: createDealDto.expectedCloseDate
          ? new Date(createDealDto.expectedCloseDate)
          : null,
        stageId: createDealDto.stageId,
        contactId: createDealDto.contactId,
        countryId: createDealDto.countryId,
        ownerId: userId,
      },
      include: {
        stage: true,
        contact: true,
        country: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(user: any, filters?: { countryId?: string; status?: DealStatus; stageId?: string }) {
    const where: any = {};

    // If user is a manager, filter by their assigned countries
    if (user.role === UserRole.MANAGER) {
      const countryIds = user.countries.map((c: any) => c.id);
      where.countryId = { in: countryIds };
    }

    // Additional filters
    if (filters?.countryId) {
      where.countryId = filters.countryId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.stageId) {
      where.stageId = filters.stageId;
    }

    const deals = await this.prisma.deal.findMany({
      where,
      include: {
        stage: true,
        contact: true,
        country: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            activities: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return deals;
  }

  async findByStage(user: any, countryId?: string) {
    const where: any = {};

    if (user.role === UserRole.MANAGER) {
      const countryIds = user.countries.map((c: any) => c.id);
      where.countryId = { in: countryIds };
    }

    if (countryId) {
      where.countryId = countryId;
    }

    const stages = await this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        deals: {
          where: {
            ...where,
            status: DealStatus.OPEN,
          },
          include: {
            contact: true,
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return stages.map((stage) => ({
      ...stage,
      totalValue: stage.deals.reduce((sum, deal) => sum + deal.value, 0),
      dealCount: stage.deals.length,
    }));
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        contact: true,
        country: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.prisma.deal.update({
      where: { id },
      data: {
        name: updateDealDto.name,
        value: updateDealDto.value,
        probability: updateDealDto.probability,
        expectedCloseDate: updateDealDto.expectedCloseDate
          ? new Date(updateDealDto.expectedCloseDate)
          : undefined,
        stageId: updateDealDto.stageId,
        contactId: updateDealDto.contactId,
        countryId: updateDealDto.countryId,
        status: updateDealDto.status,
      },
      include: {
        stage: true,
        contact: true,
        country: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async moveToStage(id: string, stageId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.prisma.deal.update({
      where: { id },
      data: { stageId },
      include: {
        stage: true,
      },
    });
  }

  async updateStatus(id: string, status: DealStatus) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.prisma.deal.update({
      where: { id },
      data: { status },
      include: {
        stage: true,
        contact: true,
      },
    });
  }

  async remove(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    await this.prisma.deal.delete({
      where: { id },
    });

    return { message: 'Deal deleted successfully' };
  }

  async getStatistics(user: any, countryId?: string) {
    const where: any = {};

    if (user.role === UserRole.MANAGER) {
      const countryIds = user.countries.map((c: any) => c.id);
      where.countryId = { in: countryIds };
    }

    if (countryId) {
      where.countryId = countryId;
    }

    const [totalDeals, wonDeals, openDeals, lostDeals] = await Promise.all([
      this.prisma.deal.aggregate({
        where,
        _sum: { value: true },
        _count: true,
      }),
      this.prisma.deal.aggregate({
        where: { ...where, status: DealStatus.WON },
        _sum: { value: true },
        _count: true,
      }),
      this.prisma.deal.aggregate({
        where: { ...where, status: DealStatus.OPEN },
        _sum: { value: true },
        _count: true,
      }),
      this.prisma.deal.aggregate({
        where: { ...where, status: DealStatus.LOST },
        _sum: { value: true },
        _count: true,
      }),
    ]);

    return {
      totalPipelineValue: totalDeals._sum.value || 0,
      totalDeals: totalDeals._count,
      wonDeals: wonDeals._count,
      wonValue: wonDeals._sum.value || 0,
      openDeals: openDeals._count,
      openValue: openDeals._sum.value || 0,
      lostDeals: lostDeals._count,
      lostValue: lostDeals._sum.value || 0,
    };
  }
}
