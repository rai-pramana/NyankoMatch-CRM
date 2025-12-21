import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class ContactsService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway
    ) {}

    async create(createContactDto: CreateContactDto, userId: string) {
        const contact = await this.prisma.contact.create({
            data: {
                name: createContactDto.name,
                email: createContactDto.email,
                phone: createContactDto.phone,
                company: createContactDto.company,
                notes: createContactDto.notes,
                countryId: createContactDto.countryId,
                createdById: userId,
            },
            include: {
                country: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "contacts",
            action: "created",
            data: contact,
            userId,
        });

        return contact;
    }

    async findAll(user: any, countryFilter?: string) {
        const where: any = {};

        // If user is a manager, filter by their assigned countries
        if (user.role === UserRole.MANAGER) {
            const countryIds = user.countries.map((c: any) => c.id);
            where.countryId = { in: countryIds };
        }

        // Additional country filter
        if (countryFilter) {
            where.countryId = countryFilter;
        }

        return this.prisma.contact.findMany({
            where,
            include: {
                country: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async findOne(id: string) {
        const contact = await this.prisma.contact.findUnique({
            where: { id },
            include: {
                country: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                deals: {
                    include: {
                        stage: true,
                    },
                },
            },
        });

        if (!contact) {
            throw new NotFoundException("Contact not found");
        }

        return contact;
    }

    async update(id: string, updateContactDto: UpdateContactDto) {
        const contact = await this.prisma.contact.findUnique({
            where: { id },
        });

        if (!contact) {
            throw new NotFoundException("Contact not found");
        }

        const updatedContact = await this.prisma.contact.update({
            where: { id },
            data: updateContactDto,
            include: {
                country: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        this.eventsGateway.emitDataChange({
            entity: "contacts",
            action: "updated",
            data: updatedContact,
        });

        return updatedContact;
    }

    async remove(id: string) {
        const contact = await this.prisma.contact.findUnique({
            where: { id },
        });

        if (!contact) {
            throw new NotFoundException("Contact not found");
        }

        await this.prisma.contact.delete({
            where: { id },
        });

        this.eventsGateway.emitDataChange({
            entity: "contacts",
            action: "deleted",
            data: { id },
        });

        return { message: "Contact deleted successfully" };
    }
}
