import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Web3 from 'web3';
import { SendAltCoinDto, SendCoinDto, SendMultipleTransactionVsPhraseDto, SendStableCoinDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TokenType } from './transaction.entity';
import { Repository } from 'typeorm';
import { Wallet, Contract } from 'ethers';
import { Account as UserAccount } from 'src/account/account.entity';
import { decrypt } from '../utils/crypto';
import { OrbitService } from 'src/orbit/orbit.service';
import { Provider } from '../blockchain/provider';
import { abi, AltToken, tokenAdress } from '../contractTokenAbi';
import { AltTokenType } from './transaction.entity';
import { newLogExplorer, newBlockExplorer } from '@celo/explorer';
import fs from 'fs';
import path from 'path';
import { IGetBalance } from './interface';

@Injectable()
export class TransactionService {
	private web3: Web3;
	private kit: any;
	private provider: any;

	constructor(
		@InjectRepository(Transaction) private readonly tranRepo: Repository<Transaction>,
		@InjectRepository(UserAccount) private readonly accountRepo: Repository<UserAccount>,
		private orbitService: OrbitService
	) {
		const providers = new Provider('https://forno.celo.org');
		this.web3 = providers.web3;
		this.kit = providers.kit;
		this.provider = providers.provider;
	}

	async accountInfo(accountAddress: string): Promise<IGetBalance> {
		try {
			// const jsonAbi = abi;
			// const derivationPath = "m/44'/52752'/0'/0" + '/0'
			// const walletMnemonic = Wallet.fromMnemonic("hire balcony else skirt together assist correct horror swing frame echo firm wealth celery enjoy curious own invite any corn dish chuckle crater convince", derivationPath)
			// const walletPrivateKey = new Wallet('0xa56e32e41f1b70998e8892505dba5e30c2241c9e221021173d74020acda259a0', this.provider)
			// console.log("adre"+walletPrivateKey.address)
			// let wallet = new CeloWallet(walletMnemonic, this.provider)
			// token_address.address.map((item)=>{
			//     console.log(item)
			// })
			let balances = {};

			let obj = {};
			for (const item of tokenAdress) {
				obj = {};
				const ethers = new Contract(item.address, abi, this.provider);
				let balance = await ethers.balanceOf(accountAddress);
				balance = this.kit.web3.utils.toBN(balance);
				balance = this.kit.web3.utils.fromWei(balance.toString(), 'ether');
				obj[item.tokenName] = balance;
				balances = Object.assign(balances, obj);
			}

			let stabletokenEUR = await this.kit.contracts.getStableToken('cEUR');
			stabletokenEUR = await stabletokenEUR.balanceOf(accountAddress);
			stabletokenEUR = this.kit.web3.utils.toBN(stabletokenEUR);
			let cEUR = this.kit.web3.utils.fromWei(stabletokenEUR.toString(), 'ether');

			let goldtoken = await this.kit.contracts.getGoldToken();
			goldtoken = await goldtoken.balanceOf(accountAddress);
			goldtoken = this.kit.web3.utils.toBN(goldtoken);
			let cello = this.kit.web3.utils.fromWei(goldtoken.toString(), 'ether');

			let stabletokenUSD = await this.kit.contracts.getStableToken();
			stabletokenUSD = await stabletokenUSD.balanceOf(accountAddress);
			stabletokenUSD = this.kit.web3.utils.toBN(stabletokenUSD);
			let cUsd = this.kit.web3.utils.fromWei(stabletokenUSD.toString(), 'ether');
			return { celoBalance: cello, cUSDBalance: cUsd, cEURBalance: cEUR, ...balances };
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async getCoinCurrency() {
		try {
			const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'currency.txt'), 'utf8'));
			return { data };
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async getTransaction(hash: string) {
		try {
			const explorer = await newLogExplorer(this.kit);
			const block = await newBlockExplorer(this.kit);
			const tx = await explorer.fetchTxReceipt(hash);
			console.log({ tx, logs: tx.logs, topics: tx.logs[0].topics });
			let a = explorer.getKnownLogs(tx);
			console.log(a);
			const logs = explorer.tryParseLog(tx.logs[0]);
			console.log({ logs });

			const blockInfo = await block.fetchBlock(9973207);
			// console.log({blockInfo: blockInfo.transactions})

			return 'success';
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async sendCelo(dto: SendCoinDto, accountId: string) {
		try {
			await this.orbitService.config();
			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
			this.kit.connection.addAccount(walletMnemonic.privateKey);
			let { amount, toAddress } = dto;

			const isAddressExist = this.web3.utils.isAddress(toAddress);
			if (!isAddressExist)
				throw new HttpException('There is not any wallet belong this address', HttpStatus.BAD_REQUEST);

			const amountWei = this.kit.web3.utils.toWei(amount, 'ether');

			let goldtoken = await this.kit.contracts.getGoldToken();
			let celotx = await goldtoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });

			let celoReceipt = await celotx.waitReceipt();
			const { blockNumber, gasUsed, status, transactionHash, events } = celoReceipt;

			const value = events.Transfer.returnValues.value.toString();
			const newTran = this.tranRepo.create({
				tokenType: TokenType.celo,
				from: walletMnemonic.address,
				value,
				to: toAddress,
				tranHash: transactionHash,
				status,
				gasUsed,
				block: blockNumber
			});
			const result = await this.tranRepo.save(newTran);

			return result;
		} catch (e) {
			console.log(e);
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async sendcUSDOrcEUR(dto: SendStableCoinDto, accountId: string) {
		//!!!!!!!
		try {
			await this.orbitService.config();
			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
			this.kit.connection.addAccount(walletMnemonic.privateKey);
			let { amount, toAddress } = dto;

			const isAddressExist = this.web3.utils.isAddress(toAddress);
			if (!isAddressExist)
				throw new HttpException('There is not any wallet belong this address', HttpStatus.BAD_REQUEST);

			const amountWei = this.kit.web3.utils.toWei(amount, 'ether');
			let stabletoken = await this.kit.contracts.getStableToken(dto.stableTokenType);
			let satbleTokentx = await stabletoken
				.transfer(toAddress, amountWei)
				.send({ from: walletMnemonic.address, feeCurrency: stabletoken.address });

			let stReceipt = await satbleTokentx.waitReceipt();
			const { blockNumber, gasUsed, status, transactionHash, events } = stReceipt;

			const value = events.Transfer[0].returnValues.value.toString();
			const newTran = this.tranRepo.create({
				tokenType: TokenType[dto.stableTokenType],
				from: walletMnemonic.address,
				value,
				to: toAddress,
				tranHash: transactionHash,
				status,
				gasUsed,
				block: blockNumber
			});
			const result = await this.tranRepo.save(newTran);
			return result;
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async sendAltCoin(dto: SendAltCoinDto, accountId: string) {
		try {
			await this.orbitService.config();
			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);

			let { amount, toAddress } = dto;

			const isAddressExist = this.web3.utils.isAddress(toAddress);
			if (!isAddressExist)
				throw new HttpException('There is not any wallet belong this address', HttpStatus.BAD_REQUEST);

			const amountWei = this.kit.web3.utils.toWei(amount, 'ether');
			const token = AltToken[dto.altTokenType];

			// const yourContract = new this.kit.web3.eth.Contract(abi, token) const account = this.web3.eth.accounts.privateKeyToAccount(walletMnemonic.privateKey).address;const transaction = yourContract.methods.transfer(toAddress, amountWei);const options = {to: transaction._parent._address,     data: transaction.encodeABI(),     gas: await transaction.estimateGas({ from: account }), }; const signed = await this.web3.eth.accounts.signTransaction(options, walletMnemonic.privateKey); const receipt = await this.web3.eth.sendSignedTransaction(signed.rawTransaction);

			this.kit.connection.addAccount(walletMnemonic.privateKey);

			let stabletoken = await this.kit.contracts.getErc20(token);
			let satbleTokentx = await stabletoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });
			let stReceipt = await satbleTokentx.waitReceipt();
			return {
				from: walletMnemonic.address,
				to: toAddress,
				value: amount,
				transactionHash: stReceipt.transactionHash
			};
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async sendMultipleCelo(dto: SendMultipleTransactionVsPhraseDto, accountId: string) {
        const errors = [];
		try {
			await this.orbitService.config();
			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);

			let multiTx, index;
			// const amountList: { token: string; amount: number }[] = [];

			const { celoBalance, cEURBalance, cUSDBalance, MOBI, MOO, POOF, UBE } = await this.accountInfo(
				walletMnemonic.address
			);

			// amountList.map((item) => {});

			this.kit.connection.addAccount(walletMnemonic.privateKey);
			let goldtoken = await this.kit.contracts.getGoldToken();
			const bacth = new this.web3.BatchRequest();

			for await (const item of dto.multipleAddresses) {
				let { amount, toAddress, tokenType } = item;
				let token = TokenType[tokenType];

				if (token == TokenType.celo && parseFloat(amount) >= parseFloat(celoBalance)) {
					errors.push('Celo amount exceeds balance');
					continue;
				}
				if (token == TokenType.cUSD && parseFloat(amount) >= parseFloat(cUSDBalance)) {
					errors.push('cUSD amount exceeds balance');
					continue;
				}
				if (token == TokenType.cEUR && parseFloat(amount) >= parseFloat(cEURBalance)) {
					errors.push('cEUR amount exceeds balance');
					continue;
				}
				if (token == TokenType.UBE && parseFloat(amount) >= parseFloat(UBE)) {
					errors.push('UBE amount exceeds balance');
					continue;
				}
				if (token == TokenType.POOF && parseFloat(amount) >= parseFloat(POOF)) {
					errors.push('POOF amount exceeds balance');
					continue;
				}
				if (token == TokenType.MOBI && parseFloat(amount) >= parseFloat(MOBI)) {
					errors.push('MOBI amount exceeds balance');
					continue;
				}
				if (token == TokenType.MOO && parseFloat(amount) >= parseFloat(MOO)) {
					errors.push('MOO amount exceeds balance');
					continue;
				}
				if (errors.length > 0) continue;

				let amountWei = this.kit.web3.utils.toWei(amount, 'ether');
				if (token == undefined) {
					throw new HttpException('This wallet type isnt exist', HttpStatus.FORBIDDEN);
				}

				if (token == TokenType.celo) {
					multiTx = await goldtoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });
					//bacth.add(await multiTx.waitReceipt());
				} else if (token == TokenType.cUSD || token == TokenType.cEUR) {
					let stabletoken = await this.kit.contracts.getStableToken(token);
					multiTx = await stabletoken
						.transfer(toAddress, amountWei)
						.send({ from: walletMnemonic.address, feeCurrency: stabletoken.address });
					//bacth.add(await multiTx.waitReceipt());
				} else {
					let altToken = AltToken[token];
					let stabletoken = await this.kit.contracts.getErc20(altToken);
					multiTx = await stabletoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });
					//bacth.add(await multiTx.waitReceipt());
				}

			}
			if (errors.length != 0) throw new HttpException([...new Set(errors)].join(), HttpStatus.FORBIDDEN);
			//bacth.execute();
			return 'success';
		} catch (e) {
            console.error(e.message)
            if(errors.length > 0){
                throw new HttpException(e.message, HttpStatus.FORBIDDEN);
            }
            throw new HttpException("Something went wrong, please chech the amounts you have entered", HttpStatus.FORBIDDEN);
		}
	}
}
