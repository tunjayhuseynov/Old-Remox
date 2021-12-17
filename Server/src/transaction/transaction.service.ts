import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Web3 from 'web3';
import {
	MimimumAmountDto,
	SendAltCoinDto,
	SendCoinDto,
	SendMultipleTransactionVsPhraseDto,
	SendStableCoinDto,
	SwapDto
} from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TokenType } from './transaction.entity';
import { Repository } from 'typeorm';
import { Wallet, Contract, ethers } from 'ethers';
import { Account as UserAccount } from 'src/account/account.entity';
import { decrypt } from '../utils/crypto';
import { OrbitService } from 'src/orbit/orbit.service';
import { Provider } from '../blockchain/provider';
import { abi, AltToken, tokenAdress, TokenNameAddress } from '../contractTokenAbi';
import fs from 'fs';
import path from 'path';
import { IGetBalance } from './interface';
import { CELO, ChainId, Fetcher, Percent, Route, Router, TokenAmount, Trade, TradeType } from '@ubeswap/sdk';
import { excAbi } from '../abi';
import { ContractKit as contractkit } from '@celo/contractkit';
import { toTransactionObject } from '@celo/connect';

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
			let balances = {};

			let obj = {};

			// const multiSig2 = await this.kit.contracts.getMultiSig("0x2D29Fc92EF173912601EBC08DFD63D15925FB77A")

			// console.log(await multiSig2.getOwners())

			// const multiSig = await this.kit._web3Contracts.getMultiSig("0x2D29Fc92EF173912601EBC08DFD63D15925FB77A")

			// const tx = toTransactionObject(
			//     this.kit.connection,
			//     multiSig.methods.addOwner("0x1051C82D597334A8C55AF238a8005fC8BC630E74"))
			// console.log(await tx.txo.call())

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
			let celo = this.kit.web3.utils.fromWei(goldtoken.toString(), 'ether');

			let stabletokenUSD = await this.kit.contracts.getStableToken();
			stabletokenUSD = await stabletokenUSD.balanceOf(accountAddress);
			stabletokenUSD = this.kit.web3.utils.toBN(stabletokenUSD);
			let cUsd = this.kit.web3.utils.fromWei(stabletokenUSD.toString(), 'ether');

			return { celoBalance: celo, cUSDBalance: cUsd, cEURBalance: cEUR, ...balances };
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

	// async getTransaction(hash: string) {
	//     try {
	//         const explorer = await newLogExplorer(this.kit)
	//         const block = await newBlockExplorer(this.kit)
	//         const tx = await explorer.fetchTxReceipt(hash)
	//         console.log({ tx, logs: tx.logs, topics: tx.logs[0].topics })
	//         let a = explorer.getKnownLogs(tx)
	//         console.log(a)
	//         const logs = explorer.tryParseLog(tx.logs[0])
	//         console.log({ logs })

	//         const blockInfo = await block.fetchBlock(9973207)
	//         // console.log({blockInfo: blockInfo.transactions})

	//         return 'success'
	//     } catch (e) {
	//         throw new HttpException(e.message, HttpStatus.FORBIDDEN);
	//     }
	// }

	async sendCelo(dto: SendCoinDto, accountId: string) {
		try {
			await this.orbitService.config();
			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
			this.kit.connection.addAccount(walletMnemonic.privateKey);
			let { amount, toAddress, comment } = dto;

			const isAddressExist = this.web3.utils.isAddress(toAddress);
			if (!isAddressExist)
				throw new HttpException('There is not any wallet belong this address', HttpStatus.BAD_REQUEST);

			const amountWei = this.kit.web3.utils.toWei(amount, 'ether');

			let goldtoken = await this.kit.contracts.getGoldToken();

			let currentBalance = await goldtoken.balanceOf(walletMnemonic.address);
			currentBalance = this.kit.web3.utils.toBN(currentBalance);
			let celoBalance = this.kit.web3.utils.fromWei(currentBalance.toString(), 'ether');

			if (amountWei >= celoBalance)
				throw new HttpException('Celo amount exceeds balance', HttpStatus.BAD_REQUEST);

			let celotx = comment
				? await goldtoken
						.transferWithComment(toAddress, amountWei, comment)
						.send({ from: walletMnemonic.address })
				: await goldtoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });

			let celoReceipt = await celotx.waitReceipt();

			return {
				from: walletMnemonic.address,
				to: toAddress,
				value: amount,
				transactionHash: celoReceipt.transactionHash
			};
		} catch (e) {
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
			let { amount, toAddress, comment } = dto;

			const isAddressExist = this.web3.utils.isAddress(toAddress);
			if (!isAddressExist)
				throw new HttpException('There is not any wallet belong this address', HttpStatus.BAD_REQUEST);

			const amountWei = this.kit.web3.utils.toWei(amount, 'ether');

			let stabletoken = await this.kit.contracts.getStableToken(dto.stableTokenType);

			let currentBalance = await stabletoken.balanceOf(walletMnemonic.address);
			currentBalance = this.kit.web3.utils.toBN(currentBalance);
			currentBalance = this.kit.web3.utils.fromWei(currentBalance.toString(), 'ether');

			if (amountWei >= currentBalance)
				throw new HttpException(`${dto.stableTokenType} amount exceeds balance`, HttpStatus.BAD_REQUEST);

			let satbleTokentx = comment
				? await stabletoken
						.transferWithComment(toAddress, amountWei, comment)
						.send({ from: walletMnemonic.address, feeCurrency: stabletoken.address })
				: await stabletoken
						.transfer(toAddress, amountWei)
						.send({ from: walletMnemonic.address, feeCurrency: stabletoken.address });

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

			const ethers = new Contract(token, abi, this.provider);
			let currentBalance = await ethers.balanceOf(walletMnemonic.address);
			currentBalance = this.kit.web3.utils.toBN(currentBalance);
			currentBalance = this.kit.web3.utils.fromWei(currentBalance.toString(), 'ether');

			if (amountWei >= currentBalance)
				throw new HttpException(`${dto.altTokenType} amount exceeds balance`, HttpStatus.BAD_REQUEST);

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
		try {
			await this.orbitService.config();
			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);

			let multiTx, index;
			const amountList: { token: string; amount: number }[] = [];
			const errors = [];
			this.kit.connection.addAccount(walletMnemonic.privateKey);
			let goldtoken = await this.kit.contracts.getGoldToken();
			const bacth = new this.web3.BatchRequest();

			for await (const item of dto.multipleAddresses) {
				let { amount, toAddress, tokenType } = item;
				let token = TokenType[tokenType];
				let amountWei = this.kit.web3.utils.toWei(amount, 'ether');
				if (token == undefined) {
					throw new HttpException('This wallet type isnt exist', HttpStatus.FORBIDDEN);
				}

				if (token == TokenType.celo) {
					multiTx = dto.comment
						? await goldtoken
								.transferWithComment(toAddress, amountWei, dto.comment)
								.send({ from: walletMnemonic.address })
						: await goldtoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });
					// bacth.add(await multiTx.waitReceipt())
				} else if (token == TokenType.cUSD || token == TokenType.cEUR) {
					let stabletoken = await this.kit.contracts.getStableToken(token);
					multiTx = dto.comment
						? await stabletoken
								.transferWithComment(toAddress, amountWei, dto.comment)
								.send({ from: walletMnemonic.address, feeCurrency: stabletoken.address })
						: await stabletoken
								.transfer(toAddress, amountWei)
								.send({ from: walletMnemonic.address, feeCurrency: stabletoken.address });
					// bacth.add(await multiTx.waitReceipt())
				} else {
					let altToken = AltToken[token];
					let stabletoken = await this.kit.contracts.getErc20(altToken);
					multiTx = await stabletoken.transfer(toAddress, amountWei).send({ from: walletMnemonic.address });
					// bacth.add(multiTx.waitReceipt())
				}
				index = amountList.findIndex((item) => item.token == token);
				index == -1
					? amountList.push({ token, amount: parseFloat(amount) })
					: (amountList[index].amount += parseFloat(amount));
			}

			const { celoBalance, cEURBalance, cUSDBalance, MOBI, MOO, POOF, UBE } = await this.accountInfo(
				walletMnemonic.address
			);
			amountList.map((item) => {
				if (item.token == TokenType.celo && item.amount >= parseFloat(celoBalance))
					errors.push('Celo amount exceeds balance');
				if (item.token == TokenType.cUSD && item.amount >= parseFloat(cUSDBalance))
					errors.push('cUSD amount exceeds balance');
				if (item.token == TokenType.cEUR && item.amount >= parseFloat(cEURBalance))
					errors.push('cEUR amount exceeds balance');
				if (item.token == TokenType.UBE && item.amount >= parseFloat(UBE))
					errors.push('UBE amount exceeds balance');
				if (item.token == TokenType.POOF && item.amount >= parseFloat(POOF))
					errors.push('POOF amount exceeds balance');
				if (item.token == TokenType.MOBI && item.amount >= parseFloat(MOBI))
					errors.push('MOBI amount exceeds balance');
				if (item.token == TokenType.MOO && item.amount >= parseFloat(MOO))
					errors.push('MOO amount exceeds balance');
			});
			if (errors.length != 0) throw new HttpException(errors.join(), HttpStatus.FORBIDDEN);

			// bacth.execute()
			return 'success';
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async exchange(dto: SwapDto, accountId: string) {
		let token;
		try {
			await this.orbitService.config();

			const { value: { iv } } = await this.orbitService.getData(accountId);
			const accPhrase = decrypt({ iv, content: dto.phrase });
			const derivationPath = "m/44'/52752'/0'/0" + '/0';
			const walletMnemonic = Wallet.fromMnemonic(accPhrase, derivationPath);
			this.kit.connection.addAccount(walletMnemonic.privateKey);
			this.kit.defaultAccount = walletMnemonic.address;

			let inputAddress = TokenNameAddress[dto.input];
			const input = await Fetcher.fetchTokenData(ChainId.MAINNET, inputAddress, this.provider);

			let outputAddress = TokenNameAddress[dto.output];
			const output = await Fetcher.fetchTokenData(ChainId.MAINNET, outputAddress, this.provider);

			if (dto.input == TokenType.celo) token = await this.kit.contracts.getGoldToken();
			else if (dto.input == TokenType.cUSD || dto.input == TokenType.cEUR)
				token = await this.kit.contracts.getStableToken(dto.input);
			else {
				let altToken = TokenNameAddress[dto.input];
				token = await this.kit.contracts.getErc20(altToken);
			}

			let approve = token.approve(
				'0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121',
				this.kit.web3.utils.toWei(dto.amount, 'ether')
			);
			let sendFunc = await approve.send();
			await sendFunc.waitReceipt();

			const addressesMain = {
				ubeswapFactory: '0x62d5b84bE28a183aBB507E125B384122D2C25fAE',
				ubeswapRouter: '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121',
				ubeswapMoolaRouter: '0x7D28570135A2B1930F331c507F65039D4937f66c'
			};

			const router = new this.kit.connection.web3.eth.Contract(
				[
					{
						inputs: [
							{
								internalType: 'uint256',
								name: 'amountIn',
								type: 'uint256'
							},
							{
								internalType: 'uint256',
								name: 'amountOutMin',
								type: 'uint256'
							},
							{
								internalType: 'address[]',
								name: 'path',
								type: 'address[]'
							},
							{
								internalType: 'address',
								name: 'to',
								type: 'address'
							},
							{
								internalType: 'uint256',
								name: 'deadline',
								type: 'uint256'
							}
						],
						name: 'swapExactTokensForTokens',
						outputs: [
							{
								internalType: 'uint256[]',
								name: 'amounts',
								type: 'uint256[]'
							}
						],
						stateMutability: 'nonpayable',
						type: 'function'
					}
				],
				addressesMain.ubeswapRouter
			);

			const pair = await Fetcher.fetchPairData(output, input, this.provider); //
			const route = new Route([ pair ], input); //
			const amountIn = ethers.utils.parseUnits(dto.amount, 'ether');
			const trade = new Trade(route, new TokenAmount(input, amountIn.toString()), TradeType.EXACT_INPUT); //
			const ubeRouter = Router.swapCallParameters(trade, {
				allowedSlippage: new Percent('50', '1000'),
				recipient: walletMnemonic.address,
				ttl: 100
			});

			const txx = await router.methods.swapExactTokensForTokens(...ubeRouter.args);

			const sender = await txx.send({ from: walletMnemonic.address });
			return 'success';
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}

	async minmumAmountOut(dto: MimimumAmountDto) {
		try {
			let inputAddress = TokenNameAddress[dto.input];
			const input = await Fetcher.fetchTokenData(ChainId.MAINNET, inputAddress, this.provider);

			let outputAddress = TokenNameAddress[dto.output];
			const output = await Fetcher.fetchTokenData(ChainId.MAINNET, outputAddress, this.provider);

			const pair = await Fetcher.fetchPairData(output, input, this.provider); //
			const route = new Route([ pair ], input); //
			const amountIn = ethers.utils.parseUnits(dto.amount, 'ether');
			const trade = new Trade(route, new TokenAmount(input, amountIn.toString()), TradeType.EXACT_INPUT); //

			const amountOut = trade.minimumAmountOut(new Percent('5', '1000'));
			let minimumAmountOut = amountOut.raw.toString();
			minimumAmountOut = this.kit.web3.utils.fromWei(minimumAmountOut, 'ether');

			return { minimumAmountOut };
		} catch (e) {
			throw new HttpException(e.message, HttpStatus.FORBIDDEN);
		}
	}
}
