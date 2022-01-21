import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Provider } from '../blockchain/provider';
import Web3 from 'web3';
import { toTransactionObject } from '@celo/connect'
import { ContractKit as contractkit } from '@celo/contractkit'
import { OrbitService } from '../orbit/orbit.service';
import { AddOwnerDto, ChangeRequirementDto, ReplaceOwnerDto, RCETransactionDto, SubmitTransactionDto, ImportAddressDto, CreateMultisigAccountDto } from './dto';
import { decrypt } from '../utils/crypto';
import { Contract, Wallet } from 'ethers';
import { stringToSolidityBytes } from '@celo/contractkit/lib/wrappers/BaseWrapper';
import { TokenType } from '../transaction/transaction.entity';
import { abi as multiSigABI, bytecode as multiSigBytecode } from '../Multisig.json'
import { abi as proxyABI, bytecode as proxyBytecode } from '../Proxy-v1.json'
import { MethodIds } from '../multisigMethodIds'
import { abi, AltToken, tokenAdress } from '../contractTokenAbi';

@Injectable()
export class MultisigService {
    private web3: Web3;
    private kit: any;
    private provider: any;

    constructor(private orbitService: OrbitService) {
        const providers = new Provider('https://forno.celo.org')
        this.web3 = providers.web3;
        this.kit = providers.kit;
        this.provider = providers.provider
    }

    async createMultisigAddress(dto: CreateMultisigAccountDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            if(dto.required> dto.owners.length+1 || dto.internalRequired>dto.owners.length+1){
                throw new HttpException("There are not owners like this number", HttpStatus.BAD_REQUEST);
            }

            const tx0 = toTransactionObject(
                this.kit.connection,
                (new this.kit.web3.eth.Contract(proxyABI as any)).deploy({ data: proxyBytecode }) as any)

            const tx1 = toTransactionObject(
                this.kit.connection,
                (new this.kit.web3.eth.Contract(multiSigABI as any)).deploy({ data: multiSigBytecode }) as any)

            const res0 = await tx0.sendAndWaitForReceipt({ from: walletMnemonic.address })
            const res1 = await tx1.sendAndWaitForReceipt({ from: walletMnemonic.address })
            if (!res0.contractAddress || !res1.contractAddress) {
                throw new HttpException("MultiSig deploy failure", HttpStatus.BAD_REQUEST);
            }
            const proxyAddress = res0.contractAddress
            const multiSigAddress = res1.contractAddress

            new Promise(resolve => setTimeout(resolve, 500))
            const initializerAbi = multiSigABI.find((abi) => abi.type === 'function' && abi.name === 'initialize')
            const callData = this.kit.web3.eth.abi.encodeFunctionCall(
                initializerAbi as any,
                [[walletMnemonic.address,...dto.owners] as any, dto.required as any, dto.internalRequired as any]
            )

            const proxy = new this.kit.web3.eth.Contract(proxyABI as any, proxyAddress)
            const txInit = toTransactionObject(
                this.kit.connection,
                proxy.methods._setAndInitializeImplementation(multiSigAddress, callData)
            )
            const txChangeOwner = toTransactionObject(
                this.kit.connection,
                proxy.methods._transferOwnership(proxyAddress)
            )
            await txInit.sendAndWaitForReceipt({ from: walletMnemonic.address })
            await txChangeOwner.sendAndWaitForReceipt({ from: walletMnemonic.address })

            const { result } = await this.orbitService.addMultisigAddress(accountId, proxyAddress)
            return { multiSigAddress: result }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async importAddress(dto: ImportAddressDto, accountId: string, accountAddress: string) {
        try {
            const multiSig = await this.kit.contracts.getMultiSig(dto.multisigAddress);

            const isOwner = await multiSig.isowner(accountAddress)
            if (!isOwner) throw new HttpException("You are not owner in this multisig address", HttpStatus.BAD_REQUEST);

            await this.orbitService.config()

            const { result: isExist } = await this.orbitService.findMultisigAddress(accountId, dto.multisigAddress)
            if (isExist) throw new HttpException("This address already exist", HttpStatus.BAD_REQUEST);

            const { result } = await this.orbitService.addMultisigAddress(accountId, dto.multisigAddress)
            return { result }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getBalance(multisigAddress: string) {
        try {
            let balances = {};
            let obj = {}

            for (const item of tokenAdress) {
                obj = {}
                const ethers = new Contract(item.address, abi, this.provider)
                let balance = await ethers.balanceOf(multisigAddress)
                balance = this.kit.web3.utils.toBN(balance);
                balance = this.kit.web3.utils.fromWei(balance.toString(), 'ether')
                obj[item.tokenName] = balance
                balances = Object.assign(balances, obj)
            }
            
            let goldtoken = await this.kit.contracts.getGoldToken()
            goldtoken = await goldtoken.balanceOf(multisigAddress)
            goldtoken = this.kit.web3.utils.toBN(goldtoken)
            let celo = this.kit.web3.utils.fromWei(goldtoken.toString(), 'ether')

            let stabletokenEUR = await this.kit.contracts.getStableToken('cEUR')
            stabletokenEUR = await stabletokenEUR.balanceOf(multisigAddress)
            stabletokenEUR = this.kit.web3.utils.toBN(stabletokenEUR);
            let cEUR = this.kit.web3.utils.fromWei(stabletokenEUR.toString(), 'ether')

            let stabletokenUSD = await this.kit.contracts.getStableToken()
            stabletokenUSD = await stabletokenUSD.balanceOf(multisigAddress)
            stabletokenUSD = this.kit.web3.utils.toBN(stabletokenUSD)
            let cUSD = this.kit.web3.utils.fromWei(stabletokenUSD.toString(), 'ether')

            return { celo, cEUR, cUSD ,...balances}
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getMultisigAddresses(accountId: string) {
        try {
            await this.orbitService.config()

            const { result: addresses } = await this.orbitService.getMultisigAddress(accountId)
            return { addresses }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async removeMultisigAddress(multisigAddress: string, accountId: string) {
        try {
            await this.orbitService.config()

            await this.orbitService.removeMultisigAddress(accountId, multisigAddress)
            return { message: "Succesfully deleted" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getOwners(multisigAddress: string) {
        try {
            const multiSig = await this.kit.contracts.getMultiSig(multisigAddress); // MultiSig Address with Celo Kit

            return await multiSig.getOwners()
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async isOwner(multisigAddress: string, accountAddress: string) {
        try {
            const multiSig = await this.kit.contracts.getMultiSig(multisigAddress);

            return await multiSig.isowner(accountAddress)
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getRequiredSignatures(multisigAddress: string) {
        try {
            const multiSig = await this.kit.contracts.getMultiSig(multisigAddress);
            const executinTransactions = await multiSig.getRequired()
            const changingMultiSigProperties = await multiSig.getInternalRequired()

            return { executinTransactions: executinTransactions.c[0], changingMultiSigProperties: changingMultiSigProperties.c[0] }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async addOwner(dto: AddOwnerDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const isAddressExist = this.web3.utils.isAddress(dto.ownerAddress);
            if (!isAddressExist) throw new HttpException("There is not any wallet belong this address", HttpStatus.BAD_REQUEST);

            const kitMultiSig = await this.kit.contracts.getMultiSig(dto.multisigAddress); // MultiSig Address with Celo Kit
            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress); // MultiSig Address with Web3

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.addOwner(dto.ownerAddress)
            );
            
            const ss = await kitMultiSig.submitOrConfirmTransaction(dto.multisigAddress, tx.txo);
            await ss.sendAndWaitForReceipt();

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async removeOwner(dto: AddOwnerDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const isAddressExist = this.web3.utils.isAddress(dto.ownerAddress);
            if (!isAddressExist) throw new HttpException("There is not any wallet belong this address", HttpStatus.BAD_REQUEST);

            const kitMultiSig = await this.kit.contracts.getMultiSig(dto.multisigAddress); // MultiSig Address with Celo Kit
            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress); // MultiSig Address with Web3

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.removeOwner(dto.ownerAddress)
            );

            const ss = await kitMultiSig.submitOrConfirmTransaction(dto.multisigAddress, tx.txo);
            await ss.sendAndWaitForReceipt();

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async replaceOwner(dto: ReplaceOwnerDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const isAddressExist = this.web3.utils.isAddress(dto.ownerAddress);
            if (!isAddressExist) throw new HttpException("There is not any wallet belong this address", HttpStatus.BAD_REQUEST);

            const kitMultiSig = await this.kit.contracts.getMultiSig(dto.multisigAddress); // MultiSig Address with Celo Kit
            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress); // MultiSig Address with Web3

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.replaceOwner(dto.ownerAddress, dto.newOwnerAddress)
            );

            const ss = await kitMultiSig.submitOrConfirmTransaction(dto.multisigAddress, tx.txo);
            await ss.sendAndWaitForReceipt();

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async changeRequirement(dto: ChangeRequirementDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const kitMultiSig = await this.kit.contracts.getMultiSig(dto.multisigAddress);
            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress);

            const countOwners = (await kitMultiSig.getOwners()).length
            if (parseInt(dto.requirement) > countOwners) {
                throw new HttpException("There are not owners like this number", HttpStatus.BAD_REQUEST);
            }

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.changeRequirement(dto.requirement)
            );

            const ss = await kitMultiSig.submitOrConfirmTransaction(dto.multisigAddress, tx.txo);
            await ss.sendAndWaitForReceipt();

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async changeInternalRequirement(dto: ChangeRequirementDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const kitMultiSig = await this.kit.contracts.getMultiSig(dto.multisigAddress);
            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress);

            const countOwners = (await kitMultiSig.getOwners()).length
            if (parseInt(dto.requirement) > countOwners) {
                throw new HttpException("There are not owners like this number", HttpStatus.BAD_REQUEST);
            }

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.changeInternalRequirement(dto.requirement)
            );

            const ss = await kitMultiSig.submitOrConfirmTransaction(dto.multisigAddress, tx.txo);
            await ss.sendAndWaitForReceipt();

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async submitTransaction(dto: SubmitTransactionDto, accountId: string) {//////////alttoken elave olummalidi/////////////////////////////
        let golden;
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress);

            let value = this.kit.web3.utils.toWei(dto.value, 'ether');

            if (dto.tokenType == TokenType.celo) golden = await this.kit.contracts.getGoldToken()
            else if (dto.tokenType == TokenType.cUSD || dto.tokenType == TokenType.cEUR) golden = await this.kit.contracts.getStableToken(dto.tokenType)
            const celoObj = golden.transfer(dto.toAddress, value);
            const txs = toTransactionObject(
                this.kit.connection,

                web3MultiSig.methods.submitTransaction(golden.address, "0", stringToSolidityBytes(celoObj.txo.encodeABI())),
            );
                
            await txs.sendAndWaitForReceipt({ from: walletMnemonic.address })
            return { message: "sucess" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async revokeTransaction(dto: RCETransactionDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress);

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.revokeConfirmation(dto.transactionId)
            );

            await tx.sendAndWaitForReceipt({ from: walletMnemonic.address })

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async confirmTransaction(dto: RCETransactionDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress);

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.confirmTransaction(dto.transactionId)
            );

            await tx.sendAndWaitForReceipt({ from: walletMnemonic.address })

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async executeTransaction(dto: RCETransactionDto, accountId: string) {
        try {
            await this.orbitService.config()

            const { value: { iv } } = await this.orbitService.getData(accountId)
            const accPhrase = decrypt({ iv, content: dto.phrase })
            const derivationPath = "m/44'/52752'/0'/0" + '/0';
            const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
            this.kit.addAccount(walletMnemonic.privateKey);
            this.kit.defaultAccount = walletMnemonic.address;

            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(dto.multisigAddress);

            const tx = toTransactionObject(
                this.kit.connection,
                web3MultiSig.methods.executeTransaction(dto.transactionId)
            );

            await tx.sendAndWaitForReceipt({ from: walletMnemonic.address })

            return { message: "success" }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getTransaction(multisigAddress: string, transactionId: string) {
        try {
            const kitMultiSig = await this.kit.contracts.getMultiSig(multisigAddress);

            let tx = await kitMultiSig.getTransaction(parseInt(transactionId))
            let txResult = tx;
            let value = this.kit.web3.utils.fromWei(tx.value.toString(), 'ether')
            txResult.value = value
            txResult.id = transactionId
            txResult.requiredCount = ""
            txResult.owner = ""
            txResult.newOwner = ""
            txResult.valueOfTransfer = ""

            let methodId = tx.data.slice(0, 10)
            txResult.method = MethodIds[methodId]

            if (methodId == "0x2e6c3721" || methodId == "0xba51a6df") {
                txResult.requiredCount = tx.data.slice(tx.data.length - 2)
            } else {
                txResult.owner = "0x" + tx.data.slice(35, 74);

                if (methodId == "0xe20056e6") txResult.newOwner = "0x" + tx.data.slice(98)
                if (methodId == "0xa9059cbb") {
                    let hex = tx.data.slice(100).replace(/^0+/, '')
                    let value = parseInt(hex, 16)
                    txResult.valueOfTransfer = this.kit.web3.utils.fromWei(value.toString(), 'ether')
                }
            }

            delete txResult.data
            return { txResult }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getTransactionsByPagination(multisigAddress: string, skip: number, take: number){
        let transactionArray = []
        let obj;
        try {
            const kitMultiSig = await this.kit.contracts.getMultiSig(multisigAddress);
            let total = await kitMultiSig.getTransactionCount(true, true)
            if(total > skip) {
                total -= skip;
            }
            let limit = total - take - 1 > 0 ? total - take - 1 : 0;
            for (let index = total-1; index > limit; index--) {
                let tx = await kitMultiSig.getTransaction(index)
               
                if(!tx || (tx && !tx['data'])) continue;

                obj = tx
                let value = this.kit.web3.utils.fromWei(tx.value.toString(), 'ether')
                obj.value = value
                obj.id = index
                obj.requiredCount = ""
                obj.owner = ""
                obj.newOwner = ""
                obj.valueOfTransfer = ""

                let methodId = tx.data.slice(0, 10)
                obj.method = MethodIds[methodId]

                if (methodId == "0x2e6c3721" || methodId == "0xba51a6df") {
                    obj.requiredCount = tx.data.slice(tx.data.length - 2)
                } else {
                    obj.owner = "0x" + tx.data.slice(35, 74);

                    if (methodId == "0xe20056e6") obj.newOwner = "0x" + tx.data.slice(98)
                    if (methodId == "0xa9059cbb") {
                        let hex = tx.data.slice(100).replace(/^0+/, '')
                        let value = parseInt(hex, 16)
                        obj.valueOfTransfer = this.kit.web3.utils.fromWei(value.toString(), 'ether')
                    }
                }

                delete obj.data
                transactionArray.push(obj)
                
            }
            return { transactionArray }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getAllTransaction(multisigAddress: string){
        try {
            const kitMultiSig = await this.kit.contracts.getMultiSig(multisigAddress);

            let transactions = await kitMultiSig.getTransactions()
            transactions.map(item=>{
                let value = this.kit.web3.utils.fromWei(item.value.toString(), 'ether')
                item.value = value
                item.requiredCount = ""
                item.owner = ""
                item.newOwner = ""
                item.valueOfTransfer = ""

                let methodId = item.data.slice(0, 10)
                item.method = MethodIds[methodId]

                if (methodId == "0x2e6c3721" || methodId == "0xba51a6df") {
                    item.requiredCount = item.data.slice(item.data.length - 2)
                } else {
                    item.owner = "0x" + item.data.slice(35, 74);

                    if (methodId == "0xe20056e6") item.newOwner = "0x" + item.data.slice(98)
                    if (methodId == "0xa9059cbb") {
                        let hex = item.data.slice(100).replace(/^0+/, '')
                        let value = parseInt(hex, 16)
                        item.valueOfTransfer = this.kit.web3.utils.fromWei(value.toString(), 'ether')
                    }
                }

                delete item.data
            })
            return {transactions} 
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }

    async getNotExecutedTransactions(multisigAddress: string) {
        let transactionArray = []
        let obj;
        try {
            const kitMultiSig = await this.kit.contracts.getMultiSig(multisigAddress);
            const web3MultiSig = await this.kit._web3Contracts.getMultiSig(multisigAddress);

            const trancationCount = await kitMultiSig.getTransactionCount(true, false)
            let getTransactionIds = web3MultiSig.methods.getTransactionIds(0, trancationCount, true, false)
            let ids = await getTransactionIds.call()

            for (const item of ids) {
                let tx = await kitMultiSig.getTransaction(parseInt(item))

                obj = tx
                let value = this.kit.web3.utils.fromWei(tx.value.toString(), 'ether')
                obj.value = value
                obj.id = item
                obj.requiredCount = ""
                obj.owner = ""
                obj.newOwner = ""
                obj.valueOfTransfer = ""

                let methodId = tx.data.slice(0, 10)
                obj.method = MethodIds[methodId]

                if (methodId == "0x2e6c3721" || methodId == "0xba51a6df") {
                    obj.requiredCount = tx.data.slice(tx.data.length - 2)
                } else {
                    obj.owner = "0x" + tx.data.slice(35, 74);

                    if (methodId == "0xe20056e6") obj.newOwner = "0x" + tx.data.slice(98)
                    if (methodId == "0xa9059cbb") {
                        let hex = tx.data.slice(100).replace(/^0+/, '')
                        let value = parseInt(hex, 16)
                        obj.valueOfTransfer = this.kit.web3.utils.fromWei(value.toString(), 'ether')
                    }
                }

                delete obj.data
                transactionArray.push(obj)
            }

            return { transactionArray }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.FORBIDDEN);
        }
    }
}