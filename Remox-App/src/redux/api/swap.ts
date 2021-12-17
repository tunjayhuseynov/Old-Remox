import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BaseUrl } from '../../utility/const'
import { RootState } from '../store';

export const swapAPI = createApi({
    reducerPath: 'swapApi',
    baseQuery: fetchBaseQuery({
        baseUrl: BaseUrl,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).storage?.user?.token;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getConvertableTokenAmount: builder.mutation<{minimumAmountOut: string}, {input: string, output: string, amount: string}>({
            query: (data) => ({
                url: '/transaction/minimumAmountOut',
                method: 'POST',
                body: data
            }),
        }),
        swapCoins: builder.mutation<void, {input: string, output: string, amount: string, phrase: string}>({
            query: (data) =>({
                url: '/transaction/swap',
                method: 'POST',
                body: data
            })
        })    
    }),
})

export const {useGetConvertableTokenAmountMutation, useSwapCoinsMutation} = swapAPI


