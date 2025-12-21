import { IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class StageOrderItem {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class ReorderStagesDto {
  @ApiProperty({ type: [StageOrderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageOrderItem)
  stages: StageOrderItem[];
}
