import { createSlice } from '@reduxjs/toolkit';
import { GetTransactions } from '../../types/sdk/blockscout';
import { RootState } from '../store';

interface InitialTransaction {
	transactions: GetTransactions | undefined;
}

const initialState: InitialTransaction = {
	transactions: undefined
};

export const TransactionAPI = createSlice({
	name: 'transactions',
	initialState: initialState,
	reducers: {
		setTransactions: (state, action) => {
			state.transactions = action.payload;
		}
	}
});

export const { setTransactions } = TransactionAPI.actions;
export const SelectTransactions = (state: RootState) => state.transactions.transactions;
export default TransactionAPI.reducer;
