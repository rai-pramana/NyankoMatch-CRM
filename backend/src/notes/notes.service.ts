import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class NotesService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway
    ) {}

    async create(createNoteDto: CreateNoteDto, userId: string) {
        const note = await this.prisma.note.create({
            data: {
                content: createNoteDto.content,
                dealId: createNoteDto.dealId,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                deal: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "notes",
            action: "created",
            data: note,
            userId,
        });

        return note;
    }

    async findByDeal(dealId: string) {
        return this.prisma.note.findMany({
            where: { dealId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async findOne(id: string) {
        const note = await this.prisma.note.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                deal: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!note) {
            throw new NotFoundException("Note not found");
        }

        return note;
    }

    async update(id: string, updateNoteDto: UpdateNoteDto) {
        const note = await this.prisma.note.findUnique({
            where: { id },
        });

        if (!note) {
            throw new NotFoundException("Note not found");
        }

        const updatedNote = await this.prisma.note.update({
            where: { id },
            data: {
                content: updateNoteDto.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "notes",
            action: "updated",
            data: updatedNote,
        });

        return updatedNote;
    }

    async remove(id: string) {
        const note = await this.prisma.note.findUnique({
            where: { id },
        });

        if (!note) {
            throw new NotFoundException("Note not found");
        }

        await this.prisma.note.delete({
            where: { id },
        });

        this.eventsGateway.emitDataChange({
            entity: "notes",
            action: "deleted",
            data: { id },
        });

        return { message: "Note deleted successfully" };
    }
}
