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
    amount: string;
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
    outputCoin?: string
    outputAmount?: string
}

export interface TransactionHookByDate {
    [name: string]: TransactionHook[]
}

export interface TransactionHookByDateInOut {
    [name: string]: {
        recieved: RenderedTransactionForm[],
        sent: RenderedTransactionForm[]
    }
}

export interface RenderedTransactionForm {
    amount: string[];
    coin: AltCoins[];
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
                let amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum, outputCoin, outputAmount, from, to;

                const tx = transaction
                rawDate = tx.timeStamp;
                blockNum = tx.blockNumber;
                hash = tx.blockNumber
                amount = parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(2)
                let feeName = Object.entries(TransactionFeeTokenName).find(w => w[0] === tx.tokenSymbol)?.[1]
                coin = feeName ? Coins[feeName] : Coins.cUSD;
                coinName = feeName ? coin.name : "Unknown";
                from = tx.from;
                to = tx.to;
                direction = tx.input.startsWith("0x38ed1739") ? TransactionDirection.Swap : tx.from.trim().toLowerCase() === selectedAccount.trim().toLowerCase() ? TransactionDirection.Out : TransactionDirection.In
                date = dateFormat(new Date(parseInt(tx.timeStamp) * 1e3), "mediumDate")
                if (direction == TransactionDirection.Swap) {
                    outputCoin = Object.values(Coins).find((w: AltCoins) => w.contractAddress.toLowerCase().includes(tx.input.substring(tx.input.length - 40).toLowerCase()))?.name;
                    outputAmount = Web3.utils.fromWei(Web3.utils.toBN(tx.input.substring(74, 74 + 64)), 'ether');
                    outputAmount = parseFloat(outputAmount).toFixed(4);
                }
                amountUSD = direction !== TransactionDirection.Swap ? (currencies[coin.name]?.price ?? 0) * parseFloat(parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(4)) : -1
                surplus = direction === TransactionDirection.In ? '+' : '-'
                type = TransactionDirection.Swap !== direction ? direction === TransactionDirection.In ? TransactionType.IncomingPayment : TransactionType.QuickTransfer : TransactionType.Swap

                return { amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum, outputCoin, outputAmount, to, from }
            })

            const byDate = _(result.filter(w => w !== null) as TransactionHook[]).groupBy("date").value() as TransactionHookByDate

            const res = Object.entries(byDate).reverse().reduce<TransactionHookByDateInOut>((a, e) => {

                const froms = _(e[1].filter(s => s.direction === TransactionDirection.In) as TransactionHook[]).groupBy("from").value() as TransactionHookByDate
                const tos = _(e[1].filter(s => s.direction === TransactionDirection.Out) as TransactionHook[]).groupBy("to").value()

                const renFroms: RenderedTransactionForm[] = [];

                Object.entries(froms).forEach(([address, transaction]) => {
                    const sameBlock = _(transaction).groupBy("blockNum").value() as TransactionHookByDate
                    Object.values(sameBlock).forEach((sameBlockTransactions) => {
                        renFroms.push({
                            amount: sameBlockTransactions.map(s => s.amount),
                            coin: sameBlockTransactions.map(s => s.coin),
                            coinName: sameBlockTransactions.map(s => s.coinName),
                            amountUSD: sameBlockTransactions.map(s => s.amountUSD),
                            address,
                            date: e[0],
                            blockNumber: sameBlockTransactions[0].blockNum,
                            rawDate: sameBlockTransactions[0].rawDate,
                            surplus: sameBlockTransactions[0].surplus
                        })
                    })

                })

                const renTos: RenderedTransactionForm[] = []

                Object.entries(tos).forEach(([address, transaction]) => {
                    const sameBlock = _(transaction).groupBy("blockNum").value() as TransactionHookByDate
                    Object.values(sameBlock).forEach((sameBlockTransactions) => {
                        renTos.push({
                            amount: sameBlockTransactions.map(s => s.amount),
                            coin: sameBlockTransactions.map(s => s.coin),
                            coinName: sameBlockTransactions.map(s => s.coinName),
                            amountUSD: sameBlockTransactions.map(s => s.amountUSD),
                            address,
                            date: e[0],
                            blockNumber: sameBlockTransactions[0].blockNum,
                            rawDate: sameBlockTransactions[0].rawDate,
                            surplus: sameBlockTransactions[0].surplus
                        })
                    })

                })

                a[e[0]] = {
                    recieved: renFroms,
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