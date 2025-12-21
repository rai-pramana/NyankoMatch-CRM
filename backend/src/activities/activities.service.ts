import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole, ActivityStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class ActivitiesService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway
    ) {}

    async create(createActivityDto: CreateActivityDto, userId: string) {
        const activity = await this.prisma.activity.create({
            data: {
                title: createActivityDto.title,
                description: createActivityDto.description,
                type: createActivityDto.type,
                dueDate: createActivityDto.dueDate ? new Date(createActivityDto.dueDate) : null,
                dealId: createActivityDto.dealId,
                assignedToId: createActivityDto.assignedToId || userId,
                createdById: userId,
            },
            include: {
                deal: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "activities",
            action: "created",
            data: activity,
            userId,
        });

        return activity;
    }

    async findAll(user: any, filters?: { status?: ActivityStatus; dealId?: string }) {
        const where: any = {};

        // If user is a manager, only show their assigned activities
        if (user.role === UserRole.MANAGER) {
            where.assignedToId = user.id;
        }

        // Additional filters
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.dealId) {
            where.dealId = filters.dealId;
        }

        return this.prisma.activity.findMany({
            where,
            include: {
                deal: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        });
    }

    async findOne(id: string) {
        const activity = await this.prisma.activity.findUnique({
            where: { id },
            include: {
                deal: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!activity) {
            throw new NotFoundException("Activity not found");
        }

        return activity;
    }

    async update(id: string, updateActivityDto: UpdateActivityDto) {
        const activity = await this.prisma.activity.findUnique({
            where: { id },
        });

        if (!activity) {
            throw new NotFoundException("Activity not found");
        }

        const updatedActivity = await this.prisma.activity.update({
            where: { id },
            data: {
                title: updateActivityDto.title,
                description: updateActivityDto.description,
                type: updateActivityDto.type,
                status: updateActivityDto.status,
                dueDate: updateActivityDto.dueDate ? new Date(updateActivityDto.dueDate) : undefined,
                assignedToId: updateActivityDto.assignedToId,
            },
            include: {
                deal: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "activities",
            action: "updated",
            data: updatedActivity,
        });

        return updatedActivity;
    }

    async complete(id: string) {
        const activity = await this.prisma.activity.findUnique({
            where: { id },
        });

        if (!activity) {
            throw new NotFoundException("Activity not found");
        }

        const completedActivity = await this.prisma.activity.update({
            where: { id },
            data: {
                status: ActivityStatus.COMPLETED,
                completedAt: new Date(),
            },
            include: {
                deal: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "activities",
            action: "updated",
            data: completedActivity,
        });

        return completedActivity;
    }

    async remove(id: string) {
        const activity = await this.prisma.activity.findUnique({
            where: { id },
        });

        if (!activity) {
            throw new NotFoundException("Activity not found");
        }

        await this.prisma.activity.delete({
            where: { id },
        });

        this.eventsGateway.emitDataChange({
            entity: "activities",
            action: "deleted",
            data: { id },
        });

        return { message: "Activity deleted successfully" };
    }

    async getPendingCount(user: any) {
        const where: any = {
            status: ActivityStatus.PENDING,
        };

        if (user.role === UserRole.MANAGER) {
            where.assignedToId = user.id;
        }

        return this.prisma.activity.count({ where });
    }
}
