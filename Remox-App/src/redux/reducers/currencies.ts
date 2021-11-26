import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface ICurrencyInternal {
	price?: number;
	percent_24?: number;
	current_balance?: number;
}

interface ICurrency {
	coins: ICoinMembers;
}

interface ICoinMembers {
	CELO: ICurrencyInternal | undefined;
	cUSD: ICurrencyInternal | undefined;
	cEUR: ICurrencyInternal | undefined;
	UBE: ICurrencyInternal | undefined;
	MOO: ICurrencyInternal | undefined;
	MOBI: ICurrencyInternal | undefined;
	POOF: ICurrencyInternal | undefined;
}

const State: ICurrency = {
	coins: {
		CELO: undefined,
		cUSD: undefined,
		cEUR: undefined,
		UBE: undefined,
		MOO: undefined,
		MOBI: undefined,
		POOF: undefined
	}
};

export const CurrencyAPI = createSlice({
	name: 'currencyAPI',
	initialState: State,
	reducers: {
		updateAllCurrencies: (state: ICurrency, action) => {
			const [ celo, cusd, ceur, ube, moo, mobi, poof ]: ICurrencyInternal[] = action.payload;
			state.coins = {
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
			const [ celo, cusd, ceur, ube, moo, mobi, poof ]: ICurrencyInternal[] = action.payload;
			state.coins = {
				CELO: { ...state.coins.CELO, current_balance: celo.current_balance },
				cUSD: { ...state.coins.cUSD, current_balance: cusd.current_balance },
				cEUR: { ...state.coins.cEUR, current_balance: ceur.current_balance},
				UBE: { ...state.coins.UBE, current_balance: ube.current_balance },
				MOO: { ...state.coins.MOO, current_balance: moo.current_balance },
				MOBI: { current_balance: mobi.current_balance },
				POOF: { current_balance: poof.current_balance }
			};
		}
	}
});

export const { updateAllCurrencies } = CurrencyAPI.actions;

export const SelectCurrencies = (state: RootState): ICoinMembers => state.currencies.coins;
export const SelectCelo = (state: RootState) => state.currencies.coins.CELO;
export const SelectCusd = (state: RootState) => state.currencies.coins.cUSD;
export const SelectCeur = (state: RootState) => state.currencies.coins.cEUR;

export default CurrencyAPI.reducer;
