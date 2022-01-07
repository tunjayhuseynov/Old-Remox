import { IsString, IsNotEmpty, IsNumber, IsEnum, IsArray } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';
import {TokenType} from '../../transaction/transaction.entity'

export class CreateMultisigAccountDto{
    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase: string;

    @ApiProperty({ description: 'Owners' })
    @IsArray()
    owners: string[];

    @ApiProperty({ description: 'Signatures required to execute TXs' })
    @IsNotEmpty()
    @IsNumber()
    required: number;

    @ApiProperty({ description: 'Signatures required to change MultiSig properties' })
    @IsNotEmpty()
    @IsNumber()
    internalRequired: number;
}

export class AddOwnerDto {
    @ApiProperty({ description: 'Multisig address' })
    @IsNotEmpty()
    @IsString()
    multisigAddress: string;

    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase: string;

    @ApiProperty({ description: 'Owner address' })
    @IsNotEmpty()
    @IsString()
    ownerAddress:string
}

export class ImportAddressDto {
    @ApiProperty({ description: 'Multisig address' })
    @IsNotEmpty()
    @IsString()
    multisigAddress: string;

}

export class ReplaceOwnerDto extends AddOwnerDto{
    @ApiProperty({ description: 'Owner address' })
    @IsNotEmpty()
    @IsString()
    newOwnerAddress:string
}

export class ChangeRequirementDto{
    @ApiProperty({ description: 'Count of requirement' })
    @IsNotEmpty()
    @IsString()
    requirement: string;

    @ApiProperty({ description: 'Multisig address' })
    @IsNotEmpty()
    @IsString()
    multisigAddress: string;

    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase: string;
}

export class RCETransactionDto{
    @ApiProperty({ description: 'Count of requirement' })
    @IsNotEmpty()
    @IsNumber()
    transactionId: number;

    @ApiProperty({ description: 'Multisig address' })
    @IsNotEmpty()
    @IsString()
    multisigAddress: string;

    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase: string;
}

export class SubmitTransactionDto{
    @ApiProperty({ description: 'Multisig address' })
    @IsNotEmpty()
    @IsString()
    multisigAddress: string;

    @ApiProperty({ description: 'Phrase of address' })
    @IsNotEmpty()
    @IsString()
    phrase: string;
    
    @ApiProperty({ description: 'Reception address' })
    @IsNotEmpty()
    @IsString()
    toAddress:string

    @ApiProperty({ description: 'Reception address' })
    @IsNotEmpty()
    @IsString()
    value:string

    @ApiProperty({ description: 'Type of Token', enum: TokenType, enumName: "TokenType" })
    @IsNotEmpty()
    @IsEnum(TokenType)
    tokenType: TokenType
}