import { IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum, IsOptional, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';
import { TokenType,StableTokenType, AltTokenType } from '../transaction.entity';
import { Type } from 'class-transformer';

export class SendCoinDto {
    @ApiProperty({ description: 'Sender address' })
    @IsNotEmpty()
    @IsString()
    toAddress: string;

    @ApiProperty({ description: 'Amount of coin' })
    @IsNotEmpty()
    @IsString()
    amount: string;

    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase: string;

    @ApiProperty({ description: 'Comment of transaction' })
    @IsOptional()
    @IsString()
    comment?:string
}

export class SendStableCoinDto extends SendCoinDto{
    @ApiProperty({ description: 'Type of Token', enum: StableTokenType, enumName: "StableTokenType" })
    @IsNotEmpty()
    @IsEnum(StableTokenType)
    stableTokenType: StableTokenType
}

export class SendAltCoinDto extends SendCoinDto{
    @ApiProperty({ description: 'Type of Token', enum: AltTokenType, enumName: "AltTokenType" })
    @IsNotEmpty()
    @IsEnum(AltTokenType)
    altTokenType: AltTokenType
}

export class SendMultipleTransactionDto{
    @ApiProperty({ description: 'Sender address' })
    @IsNotEmpty()
    @IsString()
    toAddress: string;

    @ApiProperty({ description: 'Amount of coin' })
    @IsNotEmpty()
    @IsString()
    amount: string;

    @ApiProperty({ description: 'Type of Token', enum: TokenType, enumName: "TokenType" })
    @IsNotEmpty()
    @IsEnum(TokenType)
    tokenType: TokenType
}

export class SendMultipleTransactionVsPhraseDto{
    @ApiProperty({ description: 'Address,amount and wallet type array',type:[SendMultipleTransactionDto] })
    @IsArray()
    @ValidateNested() // perform validation on children too
    @Type(() => SendMultipleTransactionDto)
    multipleAddresses:[SendMultipleTransactionDto]

    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase:string
    
    @ApiProperty({ description: 'Comment of transaction' })
    @IsOptional()
    @IsString()
    comment?:string
}

export class MinmumAmountDto{
    @ApiProperty({ description: 'Type of input token', enum: TokenType, enumName: "TokenType" })
    @IsNotEmpty()
    @IsEnum(TokenType)
    input: TokenType

    @ApiProperty({ description: 'Type of output token', enum: TokenType, enumName: "TokenType" })
    @IsNotEmpty()
    @IsEnum(TokenType)
    output: TokenType

    @ApiProperty({ description: 'Amount of exchange', enum: TokenType, enumName: "TokenType" })
    @IsNotEmpty()
    @IsString()
    amount: string

    @ApiProperty({ description: 'Slippage Percent'})
    @IsNotEmpty()
    @IsNumber()
    slippage: number

    @ApiProperty({ description: 'The deadline for Swap' })
    @IsNotEmpty()
    @IsNumber()
    deadline: number

}

export class SwapDto extends MinmumAmountDto{
    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase:string
}