import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/account.entity';
import { Repository } from 'typeorm';
import Web3 from 'web3';
import { Custumer } from './custumer.entity';
import { AddCustumerDto } from './dto';
import { Provider } from '../blockchain/provider'
import { OrbitService } from '../orbit/orbit.service';

@Injectable()
export class CustumerService {

    private web3: Web3;

    constructor(@InjectRepository(Custumer) private readonly custumerRepo: Repository<Custumer>,
        @InjectRepository(Account) private readonly accountRepo: Repository<Account>, private orbitService: OrbitService) {
        const provider = new Provider('https://forno.celo.org')
        this.web3 = provider.web3
    }


    async addCustumer(dto: AddCustumerDto, accountId: string) {
        try {
            await this.orbitService.config()

            const isAddressExist = this.web3.utils.isAddress(dto.address);
            if (!isAddressExist) throw new HttpException("There is not any wallet belong this address", HttpStatus.BAD_REQUEST);

            const {result:isExist} = await this.orbitService.findCustumer(accountId, dto.address,"address")
            if (isExist) throw new HttpException("You already have this custumer", HttpStatus.BAD_REQUEST);

            const { result } = await this.orbitService.addCustumer(accountId, dto)
            return  {result}
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getCustumers(accountId: string) {
        try {
            await this.orbitService.config() 
            const {result} = await this.orbitService.getCustumers(accountId)
            return { result }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteCustumer(accountId: string, custumerId: string) {
        try {
            await this.orbitService.config() 

            await this.orbitService.removeCustumer(accountId, custumerId)
            return { message: 'Deleted successfully' }
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
