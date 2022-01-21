const ContractKit = require('@celo/contractkit')
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountDto, IsAccountExistDto, OrbitEntityDto, ReLoginDto, SetNotificationTimeDto, SigninDto, UpdateAccountDto } from './dto';
import { Account } from './account.entity';
import { JwtService } from '@nestjs/jwt';
import { utils, Wallet } from 'ethers';
import { encrypt, existEncrypt } from '../utils/crypto'
import bcrypt from 'bcrypt'
import { OrbitService } from 'src/orbit/orbit.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AccountService {
    constructor(
        private jwtService: JwtService,
        @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
        private orbitService: OrbitService) { }

    async createAccount(dto: CreateAccountDto) {
        try {
            await this.orbitService.config()

            //blockchain side
            const entropy = utils.randomBytes(32)
            const mnemonic = utils.entropyToMnemonic(entropy)
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(mnemonic, derivationPath);
            const { iv, content } = encrypt(mnemonic)

            const id = uuidv4()
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            //ipfs orbitdb side
            const orbitDto = new OrbitEntityDto()
            orbitDto.companyName = dto.companyName ? dto.companyName : "";
            orbitDto.surname = dto.surname ? dto.surname : "";
            orbitDto.userName = dto.userName ? dto.userName : "";
            orbitDto.address = walletMnemonic.address;
            orbitDto.password = hashedPassword;
            orbitDto.iv = iv
            await this.orbitService.addData(orbitDto, id)

            return {
                token: this.generateJwt(id, walletMnemonic.address),
                accountAddress: walletMnemonic.address,
                mnemonic, encryptedPhrase: content
            }
        } catch (e) {
            console.log(e)
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async signin(dto: SigninDto) {
        try {
            await this.orbitService.config()

            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(dto.phrase, derivationPath);

            const account = await this.orbitService.findOneAccount(walletMnemonic.address)
            if (!account) {
                throw new HttpException("There is no account belong this phrase", HttpStatus.NOT_FOUND)
            }

            const isEqual = await bcrypt.compare(dto.password, account.password)
            if (!isEqual) throw new HttpException("Your password is uncorrect for this account", HttpStatus.NOT_FOUND)

            const token = this.generateJwt(account.id, account.address);
            const { content } = existEncrypt(dto.phrase, account.iv);

            return { token, accountAddress: account.address, encryptedPhrase: content }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }

    async createPassword(dto: SigninDto) {
        try {
            await this.orbitService.config()

            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(dto.phrase, derivationPath);
            const { iv, content } = encrypt(dto.phrase)

            const isExistAddress = await this.orbitService.findOneAccount(walletMnemonic.address)
            if (isExistAddress) throw new HttpException("There is already this account in app", HttpStatus.NOT_FOUND)

            const id = uuidv4()
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const orbitDto = new OrbitEntityDto()
            orbitDto.address = walletMnemonic.address;
            orbitDto.iv = iv
            orbitDto.password = hashedPassword;
            await this.orbitService.addData(orbitDto, id)

            return {
                token: this.generateJwt(id, walletMnemonic.address),
                accountAddress: walletMnemonic.address,
                encryptedPhrase: content
            }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async reLogin(dto: ReLoginDto) {
        try {
            await this.orbitService.config()
            const account = await this.orbitService.findOneAccount(dto.address)
            if (!account) {
                throw new HttpException("There is no account belong this address", HttpStatus.NOT_FOUND)
            }

            const isEqual = await bcrypt.compare(dto.password, account.password)
            if (!isEqual) throw new HttpException("Your password is uncorrect for this account", HttpStatus.NOT_FOUND)

            const token = this.generateJwt(account.id, account.address);
            return { token }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async isAccountExist(dto: IsAccountExistDto) {
        try {
            await this.orbitService.config()

            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(dto.phrase, derivationPath);
            const account = await this.orbitService.findOneAccount(walletMnemonic.address)
            let result = account ? true : false;
            return { result }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getAccountDetails(accountId: string) {
        try {
            const result  = {}
            await this.orbitService.config()
            const {value} =await this.orbitService.getData(accountId)
            result["surname"] = value.surname ? value.surname : ""
            result["userName"] = value.userName ? value.userName : ""
            result["companyName"] = value.companyName ? value.companyName : ""
            return {result} 
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async updateAccount(dto: UpdateAccountDto, accountId: string) {
        try {
            await this.orbitService.config()

            return await this.orbitService.setDatas(accountId, dto)
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async setNotificationTime(dto: SetNotificationTimeDto, accountId: string) {
        try {
            await this.orbitService.config()

            await this.orbitService.setTime(accountId, dto.time)
            return { date: dto.time }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getNotificationTime(accountId: string) {
        try {
            await this.orbitService.config()

            const { time } = await this.orbitService.getTime(accountId)
            return { date: time }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    generateJwt(userId: string, accountAddress: string) {
        return this.jwtService.sign({
            userId,
            accountAddress
        })
    }
}
