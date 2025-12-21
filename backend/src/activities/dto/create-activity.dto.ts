import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ example: 'Follow up call with client' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Discuss pricing and next steps' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ActivityType, example: ActivityType.CALL })
  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

  @ApiPropertyOptional({ example: '2024-10-24T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'deal-id' })
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ example: 'user-id' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
