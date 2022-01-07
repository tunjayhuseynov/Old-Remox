import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MultisigService } from './multisig.service';
import { Response } from 'express'
import { GetTransactionParamDto, PaginationParamDto, ParamDto } from './dto/param.dto';
import { AddOwnerDto, ChangeRequirementDto, ReplaceOwnerDto, RCETransactionDto, SubmitTransactionDto, ImportAddressDto, CreateMultisigAccountDto } from './dto';

@ApiTags('Multisig')
@Controller('multisig')
export class MultisigController {
    constructor(private multisigService: MultisigService) { }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('owners/:address')
    async owners(@Res() res: Response, @Req() req: any, @Param() param: ParamDto,): Promise<Response> {
        const result = await this.multisigService.getOwners(param.address);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('allTransactions/:address')
    async getAllTransactions(@Res() res: Response, @Req() req: any, @Param() param: ParamDto,): Promise<Response> {
        const result = await this.multisigService.getAllTransaction(param.address);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('transactions/:address/:skip/:take')
    async getTransactionsByPagination(@Res() res: Response, @Req() req: any, @Param() param: PaginationParamDto,): Promise<Response> {
        const result = await this.multisigService.getTransactionsByPagination(param.address, param.skip, param.take);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('transactions/:address')
    async notExecutedTransactions(@Res() res: Response, @Req() req: any, @Param() param: ParamDto,): Promise<Response> {
        const result = await this.multisigService.getNotExecutedTransactions(param.address);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('transaction/:address/:transactionId')
    async getTransaction(@Res() res: Response, @Req() req: any, @Param() param: GetTransactionParamDto,): Promise<Response> {
        const result = await this.multisigService.getTransaction(param.address,param.transactionId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('required/:address')
    async requiredSignatures(@Res() res: Response, @Req() req: any, @Param() param: ParamDto): Promise<Response> {
        const result = await this.multisigService.getRequiredSignatures(param.address);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('addresses')
    async getAddresses(@Res() res: Response, @Req() req: any): Promise<Response> {
        const result = await this.multisigService.getMultisigAddresses(req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @Get('balance/:address')
    async getBalance(@Res() res: Response, @Req() req: any, @Param() param: ParamDto): Promise<Response> {
        const result = await this.multisigService.getBalance(param.address);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: CreateMultisigAccountDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Post('createMultisig')
    async createMultisig(@Req() req: any, @Res() res: Response, @Body() dto: CreateMultisigAccountDto): Promise<Response> {
        const result = await this.multisigService.createMultisigAddress(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: AddOwnerDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Post('addOwner')
    async addOwner(@Req() req: any, @Res() res: Response, @Body() dto: AddOwnerDto): Promise<Response> {
        const result = await this.multisigService.addOwner(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: ImportAddressDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Post('importAddress')
    async importAddress(@Req() req: any, @Res() res: Response, @Body() dto: ImportAddressDto): Promise<Response> {
        const result = await this.multisigService.importAddress(dto, req.user.userId, req.user.accountAddress);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: SubmitTransactionDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Post('submitTransaction')
    async submitTransaction(@Req() req: any, @Res() res: Response, @Body() dto: SubmitTransactionDto): Promise<Response> {
        const result = await this.multisigService.submitTransaction(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: AddOwnerDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Delete('removeOwner')
    async removeOwner(@Req() req: any, @Res() res: Response, @Body() dto: AddOwnerDto): Promise<Response> {
        const result = await this.multisigService.removeOwner(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Delete('removeAddress/:address')
    async removeMultisigAddress(@Req() req: any, @Res() res: Response, @Param() param: ParamDto,): Promise<Response> {
        const result = await this.multisigService.removeMultisigAddress(param.address, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: ReplaceOwnerDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Patch('replaceOwner')
    async replaceOwner(@Req() req: any, @Res() res: Response, @Body() dto: ReplaceOwnerDto): Promise<Response> {
        const result = await this.multisigService.replaceOwner(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: ChangeRequirementDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Patch('changeRequirement')
    async changeRequirement(@Req() req: any, @Res() res: Response, @Body() dto: ChangeRequirementDto): Promise<Response> {
        const result = await this.multisigService.changeRequirement(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: ChangeRequirementDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Patch('changeInternalRequirement')
    async changeInternalRequirement(@Req() req: any, @Res() res: Response, @Body() dto: ChangeRequirementDto): Promise<Response> {
        const result = await this.multisigService.changeInternalRequirement(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }


    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: RCETransactionDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Patch('confirmTransaction')
    async confirmTransaction(@Req() req: any, @Res() res: Response, @Body() dto: RCETransactionDto): Promise<Response> {
        const result = await this.multisigService.confirmTransaction(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: RCETransactionDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Patch('revokeTransaction')
    async revokeTransaction(@Req() req: any, @Res() res: Response, @Body() dto: RCETransactionDto): Promise<Response> {
        const result = await this.multisigService.revokeTransaction(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: RCETransactionDto })
    @ApiOkResponse()
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    @ApiBearerAuth('JWT-auth')
    @Patch('executeTransaction')
    async executeTransaction(@Req() req: any, @Res() res: Response, @Body() dto: RCETransactionDto): Promise<Response> {
        const result = await this.multisigService.executeTransaction(dto, req.user.userId);
        return res.status(HttpStatus.OK).json(result)
    }
}
