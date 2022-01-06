export interface GetMinimumAmount {
	input: string;
	output: string;
	amount: string;
	slippage: number;
	deadline: number;
}

export interface GetMinimumAmountResponse {
	minimumAmountOut: string;
	oneTokenValue: string;
	feeAmount: string;
}

export interface GetSwap extends GetMinimumAmount{
    phrase: string;
}

export interface GetSwapResponse {
	hash: string
}