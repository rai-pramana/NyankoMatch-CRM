import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
        countries: createUserDto.countryIds
          ? {
              create: createUserDto.countryIds.map((countryId) => ({
                country: { connect: { id: countryId } },
              })),
            }
          : undefined,
      },
      include: {
        countries: {
          include: {
            country: true,
          },
        },
      },
    });

    return this.formatUserResponse(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        countries: {
          include: {
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.formatUserResponse(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        countries: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check for conflicts
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update countries if provided
    if (updateUserDto.countryIds !== undefined) {
      // Delete existing country associations
      await this.prisma.userCountry.deleteMany({
        where: { userId: id },
      });

      // Create new associations
      if (updateUserDto.countryIds.length > 0) {
        await this.prisma.userCountry.createMany({
          data: updateUserDto.countryIds.map((countryId) => ({
            userId: id,
            countryId,
          })),
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        password: hashedPassword,
        name: updateUserDto.name,
        role: updateUserDto.role,
        isActive: updateUserDto.isActive,
      },
      include: {
        countries: {
          include: {
            country: true,
          },
        },
      },
    });

    return this.formatUserResponse(user);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  private formatUserResponse(user: any) {
    const { password, countries, ...rest } = user;
    return {
      ...rest,
      countries: countries?.map((uc: any) => uc.country) || [],
    };
  }
}
