import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ example: 'United States' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: '$' })
  @IsString()
  @IsOptional()
  currencySymbol?: string;

  @ApiPropertyOptional({ example: 1.08 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  exchangeRate?: number;
}
