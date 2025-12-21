import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ example: 'Client mentioned they need faster delivery times' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'deal-id' })
  @IsString()
  @IsNotEmpty()
  dealId: string;
}
