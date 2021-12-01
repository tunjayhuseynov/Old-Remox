import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { request, gql, ClientError } from 'graphql-request';
import { GetTransactions } from '../../types/sdk';


export const BlockScoutApi = createApi({
	baseQuery: fetchBaseQuery({
		baseUrl: 'https://explorer.celo.org/api'
	}),
	endpoints: (builder) => ({
		getTransactions: builder.query<GetTransactions, string>({
			query: (data) => ({
				url: `?module=account&action=tokentx&address=`+data
			})
		})
	})
});

export const { useGetTransactionsQuery, useLazyGetTransactionsQuery } = BlockScoutApi;
