import { createSlice } from '@reduxjs/toolkit';
import { AltCoins } from '../../types/coins';
import Initalization from '../../utility/init';
import { RootState } from '../store';

export interface ICurrencyInternal {
	price?: number;
	percent_24?: number;
	current_balance?: number;
}

export interface IBalanceItem {
	amount: number;
	per_24: number;
	percent: number;
	coins: AltCoins;
	reduxValue: number;
}

interface IBalanceMembers {
	CELO: IBalanceItem | undefined;
	cUSD: IBalanceItem | undefined;
	cEUR: IBalanceItem | undefined;
	UBE: IBalanceItem | undefined;
	MOO: IBalanceItem | undefined;
	MOBI: IBalanceItem | undefined;
	POOF: IBalanceItem | undefined;
}

interface ICurrency {
	celoCoins: ICoinMembers;
	balances: IBalanceMembers;
}

export interface ICoinMembers {
	CELO: ICurrencyInternal | undefined;
	cUSD: ICurrencyInternal | undefined;
	cEUR: ICurrencyInternal | undefined;
	UBE: ICurrencyInternal | undefined;
	MOO: ICurrencyInternal | undefined;
	MOBI: ICurrencyInternal | undefined;
	POOF: ICurrencyInternal | undefined;
}

const State: ICurrency = {
	celoCoins: {
		CELO: undefined,
		cUSD: undefined,
		cEUR: undefined,
		UBE: undefined,
		MOO: undefined,
		MOBI: undefined,
		POOF: undefined
	},
	balances: {
		CELO: undefined,
		cUSD: undefined,
		cEUR: undefined,
		UBE: undefined,
		MOO: undefined,
		MOBI: undefined,
		POOF: undefined
	}
};

export const CurrencySlice = createSlice({
	name: 'currencySlice',
	initialState: State,
	reducers: {
		updateAllCurrencies: (state: ICurrency, action) => {
			if (!action.payload) return
			const [celo, cusd, ceur, ube, moo, mobi, poof]: ICurrencyInternal[] = action.payload;
			state.celoCoins = {
				CELO: { percent_24: celo.percent_24, price: celo.price },
				cUSD: { percent_24: cusd.percent_24, price: cusd.price },
				cEUR: { percent_24: ceur.percent_24, price: ceur.price },
				UBE: { percent_24: ube.percent_24, price: ube.price },
				MOO: { percent_24: moo.percent_24, price: moo.price },
				MOBI: { percent_24: mobi.percent_24, price: mobi.price },
				POOF: { percent_24: poof.percent_24, price: poof.price }
			};
		},
		updateBalance: (state: ICurrency, action) => {
			if (!action.payload) return
			const [celo, cusd, ceur, ube, moo, mobi, poof]: ICurrencyInternal[] = action.payload;
			state.celoCoins = {
				CELO: { ...state.celoCoins.CELO, current_balance: celo.current_balance },
				cUSD: { ...state.celoCoins.cUSD, current_balance: cusd.current_balance },
				cEUR: { ...state.celoCoins.cEUR, current_balance: ceur.current_balance },
				UBE: { ...state.celoCoins.UBE, current_balance: ube.current_balance },
				MOO: { ...state.celoCoins.MOO, current_balance: moo.current_balance },
				MOBI: { current_balance: mobi.current_balance },
				POOF: { current_balance: poof.current_balance }
			};
		},
		deleteBalance: (state: ICurrency) => {
			state.celoCoins = {
				CELO: undefined,
				cUSD: undefined,
				cEUR: undefined,
				UBE: undefined,
				MOO: undefined,
				MOBI: undefined,
				POOF: undefined
			}
			state.balances = {
				CELO: undefined,
				cUSD: undefined,
				cEUR: undefined,
				UBE: undefined,
				MOO: undefined,
				MOBI: undefined,
				POOF: undefined
			}
		},
		updateUserBalance: (state: ICurrency, action) => {
			if (!action.payload) return
			const [celo, cusd, ceur, ube, moo, mobi, poof]: IBalanceItem[] = action.payload;
			state.balances = {
				CELO: {
					amount: celo.amount,
					per_24: celo.per_24,
					percent: celo.percent,
					coins: celo.coins,
					reduxValue: celo.reduxValue
				},
				cUSD: {
					amount: cusd.amount,
					per_24: cusd.per_24,
					percent: cusd.percent,
					coins: cusd.coins,
					reduxValue: cusd.reduxValue
				},
				cEUR: {
					amount: ceur.amount,
					per_24: ceur.per_24,
					percent: ceur.percent,
					coins: ceur.coins,
					reduxValue: ceur.reduxValue
				},
				UBE: {
					amount: ube.amount,
					per_24: ube.per_24,
					percent: ube.percent,
					coins: ube.coins,
					reduxValue: ube.reduxValue
				},
				MOO: {
					amount: moo.amount,
					per_24: moo.per_24,
					percent: moo.percent,
					coins: moo.coins,
					reduxValue: moo.reduxValue
				},
				MOBI: {
					amount: mobi.amount,
					per_24: mobi.per_24,
					percent: mobi.percent,
					coins: mobi.coins,
					reduxValue: mobi.reduxValue
				},
				POOF: {
					amount: poof.amount,
					per_24: poof.per_24,
					percent: poof.percent,
					coins: poof.coins,
					reduxValue: poof.reduxValue
				}
			};
		}
	}
});

export const { updateAllCurrencies, updateUserBalance, deleteBalance } = CurrencySlice.actions;

export const SelectCurrencies = (state: RootState): ICoinMembers => state.currencyandbalance.celoCoins;
export const SelectBalances = (state: RootState): IBalanceMembers => state.currencyandbalance.balances;
export const SelectCelo = (state: RootState) => state.currencyandbalance.celoCoins.CELO;
export const SelectCusd = (state: RootState) => state.currencyandbalance.celoCoins.cUSD;
export const SelectCeur = (state: RootState) => state.currencyandbalance.celoCoins.cEUR;

export default CurrencySlice.reducer;
