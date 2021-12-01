import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

interface NotificatinoState {
    onSuccess: boolean;
    onError: boolean;
    onErrorText: string;
}

const initialState: NotificatinoState = {
    onSuccess: false,
    onError: false,
    onErrorText: ''
}

export const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        changeError: (state, action: PayloadAction<{activate: boolean; text?: string}>) => {
            state.onErrorText = action.payload.text || "Something went wrong";
            state.onError = action.payload.activate;
        },
        changeSuccess: (state, action: PayloadAction<boolean>) => {
            state.onSuccess = action.payload;
        }
    },
})

export const { changeError, changeSuccess } = notificationSlice.actions

export const selectError = (state: RootState) => state.notification.onError
export const selectErrorText = (state: RootState) => state.notification.onErrorText
export const selectSuccess = (state: RootState) => state.notification.onSuccess

export default notificationSlice.reducer