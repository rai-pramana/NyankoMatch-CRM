import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ActivityStatus } from '@prisma/client';
import { CreateActivityDto } from './create-activity.dto';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;
}
