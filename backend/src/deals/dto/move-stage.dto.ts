import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveStageDto {
  @ApiProperty({ example: 'stage-id' })
  @IsString()
  @IsNotEmpty()
  stageId: string;
}
