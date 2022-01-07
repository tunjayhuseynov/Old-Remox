import { ApiProperty } from "@nestjs/swagger";

export class ParamDto {
    @ApiProperty({description:"Multisig address"})
    address:string
}

export class PaginationParamDto extends ParamDto {
    @ApiProperty({description:"Skip number"})
    skip:number

    @ApiProperty({description:"Take number"})
    take:number
}

export class GetTransactionParamDto extends ParamDto {
    @ApiProperty({description:"TransactionId"})
    transactionId:string
}