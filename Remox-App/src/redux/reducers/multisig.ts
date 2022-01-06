import { createSlice } from '@reduxjs/toolkit';
import { NonExecTransactionItem } from '../../types/sdk';
import { RootState } from '../store';

interface State {
    transactions: NonExecTransactionItem[] | undefined;
}

const initialState: State = {
    transactions: []
};

export const multisigSlice = createSlice({
    name: 'multisig',
    initialState: initialState,
    reducers: {
        setTransactions: (state, action) => {
            if(action.payload !== undefined || action.payload !== []){
                if(state.transactions) state.transactions = [...state.transactions, ...action.payload];
                else state.transactions = [...action.payload];
            }else state.transactions = action.payload
        }
    }
});

export const { setTransactions } = multisigSlice.actions;

export const selectMultisigTransactions = (state: RootState) => state.multisig.transactions;

export default multisigSlice.reducer;
