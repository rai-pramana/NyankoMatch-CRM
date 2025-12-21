import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DealStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: DealStatus, example: DealStatus.WON })
  @IsEnum(DealStatus)
  @IsNotEmpty()
  status: DealStatus;
}
