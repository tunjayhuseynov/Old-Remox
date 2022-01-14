import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { TokenType } from "../../transaction/transaction.entity";

export enum Interval {
    weakly = "weakly",
    monthly = "monthly"
}

export class CreateTeamMemberDto {
    @ApiProperty({ description: 'Name of team member' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Address of team member' })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({ description: 'Type of Token', enum: TokenType, enumName: "TokenType" })
    @IsNotEmpty()
    @IsEnum(TokenType)
    currency: TokenType;

    @ApiProperty({ description: 'The amount send' })
    @IsNotEmpty()
    @IsString()
    amount: string;

    @ApiProperty({ description: 'Date of paymant' })
    @IsNotEmpty()
    @IsString()
    paymantDate:string

    @ApiProperty({ description: 'Interval of paymant', enum: Interval, enumName: "Interval" })
    @IsNotEmpty()
    @IsEnum(Interval)
    interval: Interval;

    @ApiProperty({ description: 'Is usd base or not' })
    @IsNotEmpty()
    @IsBoolean()
    usdBase: boolean

    @ApiProperty({ description: 'Type of Token', enum: TokenType, enumName: "TokenType" })
    @IsOptional()
    @IsEnum(TokenType)
    secondaryCurrency?: TokenType;

    @ApiProperty({ description: 'The amount send' })
    @IsOptional()
    @IsString()
    secondaryAmount?: string;

    @ApiProperty({ description: 'Is usd base or not' })
    @IsOptional()
    @IsBoolean()
    secondaryUsdBase?: boolean

    @ApiProperty({ description: 'Team id which this team member will add' })
    @IsNotEmpty()
    @IsString()
    teamId: string;
}

export class UpdateTeamMemberDto {
    @ApiProperty({ description: 'Id of team member' })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiPropertyOptional({ description: 'Name of team member' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Address of team member' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Type of Token', enum: TokenType, enumName: "TokenType" })
    @IsOptional()
    @IsEnum(TokenType)
    currency?: TokenType;

    @ApiPropertyOptional({ description: 'The amount send' })
    @IsOptional()
    @IsString()
    amount?: string;

    @ApiProperty({ description: 'Is usd base or not' })
    @IsOptional()
    @IsBoolean()
    usdBase?: boolean

    @ApiProperty({ description: 'Type of Token', enum: TokenType, enumName: "TokenType" })
    @IsOptional()
    @IsEnum(TokenType)
    secondaryCurrency?: TokenType;

    @ApiProperty({ description: 'The amount send' })
    @IsOptional()
    @IsString()
    secondaryAmount?: string;

    @ApiProperty({ description: 'Is usd base or not' })
    @IsOptional()
    @IsBoolean()
    secondaryUsdBase?: boolean

    @ApiPropertyOptional({ description: 'Team id of team member' })
    @IsOptional()
    @IsUUID()
    teamId?: string;
}