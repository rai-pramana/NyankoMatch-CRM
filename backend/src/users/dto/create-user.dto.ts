import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsBoolean, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class CreateUserDto {
    @ApiProperty({ example: "John Doe" })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: "john@nyankomatch.com" })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: "Password123!" })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ example: ["country-id-1", "country-id-2"] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    countryIds?: string[];
}
