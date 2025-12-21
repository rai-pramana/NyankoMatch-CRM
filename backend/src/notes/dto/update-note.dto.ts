import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated note content' })
  @IsString()
  @IsOptional()
  content?: string;
}
