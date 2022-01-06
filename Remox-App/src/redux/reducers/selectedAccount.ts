import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

const initialState : {address: string} = {
    address: ""
}

export const SelectedAccountSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        changeAccount: (state, action: PayloadAction<string>) => {
            state.address = action.payload
        },
 
    },
})

export const { changeAccount } = SelectedAccountSlice.actions

export const SelectSelectedAccount = (state: RootState) => state.selectedAccount.address

export default SelectedAccountSlice.reducer