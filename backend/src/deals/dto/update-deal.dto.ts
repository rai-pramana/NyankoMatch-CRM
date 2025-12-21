import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DealStatus } from '@prisma/client';
import { CreateDealDto } from './create-deal.dto';

export class UpdateDealDto extends PartialType(CreateDealDto) {
  @IsEnum(DealStatus)
  @IsOptional()
  status?: DealStatus;
}
