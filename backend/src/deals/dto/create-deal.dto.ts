import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDealDto {
  @ApiProperty({ example: 'Enterprise License Expansion' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 125000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 75 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2024-10-24' })
  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @ApiProperty({ example: 'stage-id' })
  @IsString()
  @IsNotEmpty()
  stageId: string;

  @ApiProperty({ example: 'contact-id' })
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ example: 'country-id' })
  @IsString()
  @IsNotEmpty()
  countryId: string;
}
