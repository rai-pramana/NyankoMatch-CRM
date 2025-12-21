import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCountryDto: CreateCountryDto) {
    const existing = await this.prisma.country.findFirst({
      where: {
        OR: [
          { name: createCountryDto.name },
          { code: createCountryDto.code },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Country with this name or code already exists');
    }

    return this.prisma.country.create({
      data: createCountryDto,
    });
  }

  async findAll() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            deals: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            deals: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    return country;
  }

  async update(id: string, updateCountryDto: UpdateCountryDto) {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    // Check for conflicts
    if (updateCountryDto.name || updateCountryDto.code) {
      const existing = await this.prisma.country.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateCountryDto.name ? { name: updateCountryDto.name } : {},
                updateCountryDto.code ? { code: updateCountryDto.code } : {},
              ].filter((obj) => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (existing) {
        throw new ConflictException('Country with this name or code already exists');
      }
    }

    return this.prisma.country.update({
      where: { id },
      data: updateCountryDto,
    });
  }

  async remove(id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    if (country._count.contacts > 0 || country._count.deals > 0) {
      throw new ConflictException(
        'Cannot delete country with existing contacts or deals',
      );
    }

    // Delete user country associations first
    await this.prisma.userCountry.deleteMany({
      where: { countryId: id },
    });

    await this.prisma.country.delete({
      where: { id },
    });

    return { message: 'Country deleted successfully' };
  }
}
