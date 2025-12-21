import { IsNotEmpty, IsString, IsEmail, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateContactDto {
    @ApiProperty({ example: "Jane Cooper" })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: "jane@example.com" })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ example: "+1 (555) 0123-4567" })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: "TechFlow Inc." })
    @IsString()
    @IsOptional()
    company?: string;

    @ApiPropertyOptional({ example: "CEO" })
    @IsString()
    @IsOptional()
    position?: string;

    @ApiPropertyOptional({ example: "Interested in enterprise plan" })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ example: "country-id" })
    @IsString()
    @IsNotEmpty()
    countryId: string;
}
