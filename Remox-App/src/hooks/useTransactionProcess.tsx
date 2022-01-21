import { useEffect, useMemo } from 'react';
import { useAppSelector } from '../redux/hooks';
import { SelectTransactions } from '../redux/reducers/transactions';
import lodash from 'lodash';
import { GetTransactions, Transactions } from '../types/sdk';
import _ from 'lodash';
import Web3 from 'web3';
import { AltCoins, Coins, TransactionFeeTokenName } from '../types/coins';
import { selectStorage } from '../redux/reducers/storage';
import dateFormat from 'dateformat';
import { TransactionDirection, TransactionType } from '../types';
import { SelectCurrencies } from '../redux/reducers/currencies';
import store, { RootState } from '../redux/store';
import { useSelector } from 'react-redux';
import { useGetNotExecutedTransactionsQuery, useLazyGetNotExecutedTransactionsQuery } from '../redux/api';
import selectedAccount, { SelectSelectedAccount } from '../redux/reducers/selectedAccount';
import transaction from '../pages/multisig/transaction';

export interface TransactionHook {
    amount: number;
    coin: AltCoins;
    coinName: string;
    direction: TransactionDirection;
    date: string;
    amountUSD: number;
    surplus: string;
    type: TransactionType;
    hash: string;
    rawDate: string;
    blockNum: string;
    from: string;
    to: string;
    swap?: {
        outputCoin: AltCoins
        outputAmount: string
        outputCoinName: string
        inputCoin: AltCoins
        inputCoinName: string
        inputAmount: string
    }
}

export interface TransactionHookByDate {
    [name: string]: TransactionHook[]
}

export interface TransactionHookByDateInOut {
    [name: string]: {
        date: string,
        recieved: RenderedTransactionForm[],
        swaps: TransactionHook[],
        sent: RenderedTransactionForm[]
    }
}

export interface RenderedTransactionForm {
    amount: string[];
    coin: AltCoins[];
    hashs: string[];
    address: string;
    date: string;
    coinName: string[];
    blockNumber: string;
    amountUSD: number[];
    rawDate: string;
    surplus: string;
}

const useTransactionProcess = (groupByDate = false): [TransactionHookByDateInOut, GetTransactions] | [] => {
    const transactions = useSelector(SelectTransactions);
    const currencies = useSelector((state: RootState) => state.currencyandbalance.celoCoins);
    const selectedAccount = useSelector(SelectSelectedAccount);

    return useMemo(() => {
        if (transactions) {
            let result = [...transactions.result].reverse().map((transaction, index) => {
                let amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum, outputCoin, outputAmount, outputCoinName, inputCoin, inputAmount, inputCoinName, from, to, swap;

                const tx = transaction
                rawDate = tx.timeStamp;
                blockNum = tx.blockNumber;
                hash = tx.hash
                amount = parseFloat(Web3.utils.fromWei(tx.value, 'ether'))
                let feeName = Object.entries(TransactionFeeTokenName).find(w => w[0] === tx.tokenSymbol)?.[1]
                coin = feeName ? Coins[feeName] : Coins.cUSD;
                coinName = feeName ? coin.name : "Unknown";
                from = tx.from;
                to = tx.to;
                direction = tx.input.startsWith("0x38ed1739") ? TransactionDirection.Swap : tx.from.trim().toLowerCase() === selectedAccount.trim().toLowerCase() ? TransactionDirection.Out : TransactionDirection.In
                date = dateFormat(new Date(parseInt(tx.timeStamp) * 1e3), "mediumDate")
                if (direction == TransactionDirection.Swap) {
                    inputCoin = Object.values(Coins).find((w: AltCoins) => w.contractAddress.toLowerCase().includes(tx.input.substring(tx.input.length - 64 - 40, tx.input.length - 64).toLowerCase()));
                    inputCoinName = inputCoin.name
                    inputAmount = Web3.utils.fromWei(Web3.utils.toBN(tx.input.substring(10, 74)), 'ether');
                    inputAmount = parseFloat(inputAmount).toFixed(2);


                    outputCoin = Object.values(Coins).find((w: AltCoins) => w.contractAddress.toLowerCase().includes(tx.input.substring(tx.input.length - 40).toLowerCase()));
                    outputCoinName = outputCoin.name
                    outputAmount = Web3.utils.fromWei(Web3.utils.toBN(tx.input.substring(74, 74 + 64)), 'ether');
                    outputAmount = parseFloat(outputAmount).toFixed(2);

                    swap = {
                        inputAmount,
                        inputCoin,
                        inputCoinName,
                        outputAmount,
                        outputCoin,
                        outputCoinName
                    }
                }
                amountUSD = direction !== TransactionDirection.Swap ? (currencies[coin.name]?.price ?? 0) * parseFloat(parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(4)) : -1
                surplus = direction === TransactionDirection.In ? '+' : '-'
                type = TransactionDirection.Swap !== direction ? direction === TransactionDirection.In ? TransactionType.IncomingPayment : TransactionType.QuickTransfer : TransactionType.Swap

                return { amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum, swap, to, from }
            })

            const byBlockNumber = _(result.filter(w => w !== null) as TransactionHook[]).groupBy("blockNum").value() as TransactionHookByDate

            const res = Object.entries(byBlockNumber).reverse().reduce<TransactionHookByDateInOut>((a, e, i) => {

                const filtered: TransactionHook[] = []
                const hashFilter = _(e[1] as TransactionHook[]).groupBy("hash").value() as TransactionHookByDate

                Object.entries(hashFilter).forEach(([hash, transactions]) => {
                    filtered.push(_.maxBy(transactions, 'amount') as TransactionHook)
                })

                const froms = _(filtered.filter(s => s.direction === TransactionDirection.In) as TransactionHook[]).groupBy("from").value() as TransactionHookByDate
                const swaps = filtered.filter(s => s.direction === TransactionDirection.Swap) as TransactionHook[]
                const tos = _(filtered.filter(s => s.direction === TransactionDirection.Out) as TransactionHook[]).groupBy("to").value()

                const renFroms: RenderedTransactionForm[] = [];

                Object.entries(froms).forEach(([address, transaction]) => {
                    renFroms.push({
                        amount: transaction.map(s => s.amount.toFixed(2)),
                        coin: transaction.map(s => s.coin),
                        coinName: transaction.map(s => s.coinName),
                        amountUSD: transaction.map(s => s.amountUSD),
                        address,
                        date: transaction[0].date,
                        blockNumber: transaction[0].blockNum,
                        hashs: transaction.map(s => s.hash),
                        rawDate: transaction[0].rawDate,
                        surplus: transaction[0].surplus
                    })

                })

                const renTos: RenderedTransactionForm[] = []

                Object.entries(tos).forEach(([address, transaction]) => {
                    renTos.push({
                        amount: transaction.map(s => s.amount.toFixed(2)),
                        coin: transaction.map(s => s.coin),
                        coinName: transaction.map(s => s.coinName),
                        amountUSD: transaction.map(s => s.amountUSD),
                        hashs: transaction.map(s => s.hash),
                        address,
                        date: transaction[0].date,
                        blockNumber: transaction[0].blockNum,
                        rawDate: transaction[0].rawDate,
                        surplus: transaction[0].surplus
                    })

                })

                a[i] = {
                    date: e[1][0].date,
                    recieved: renFroms,
                    swaps,
                    sent: renTos,
                }
                return a;
            }, {})

            return [res, transactions];
        };
        return []
    }, [transactions])
}
export default useTransactionProcess;