import { ApiProperty } from '@nestjs/swagger';
import { TokenType } from '../transaction.entity';

export class IGetBalance{
    @ApiProperty()
    celoBalance:string;
    
    @ApiProperty()
    cUSDBalance:string;

    @ApiProperty()
    cEURBalance:string;

    @ApiProperty()
    UBE?:string;

    @ApiProperty()
    MOO?:string;

    @ApiProperty()
    MOBI?:string;

    @ApiProperty()
    POOF?:string;

    @ApiProperty()
    cREAL?:string;
}

export class IGetTransactionReceipt{
    @ApiProperty()
    tranHash!: string;

    @ApiProperty()
    block!: string;

    @ApiProperty()
    gasUsed!:string

    @ApiProperty()
    from!: string;

    @ApiProperty()
    status!:boolean

    @ApiProperty()
    tokenType: TokenType

    @ApiProperty()
    to!: string

    @ApiProperty()
    value!: string
}