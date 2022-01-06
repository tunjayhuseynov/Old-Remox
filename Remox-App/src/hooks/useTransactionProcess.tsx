import { useEffect, useMemo } from 'react';
import { useAppSelector } from '../redux/hooks';
import { SelectTransactions } from '../redux/reducers/transactions';
import lodash from 'lodash';
import { Transactions } from '../types/sdk';
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

export interface TransactionHook {
    amount: string;
    coin: AltCoins | undefined;
    coinName: string;
    direction: TransactionDirection;
    date: string;
    amountUSD: number;
    surplus: string;
    type: TransactionType;
    hash: string;
    rawDate: string;
    blockNum: string;
    outputCoin?: string
    outputAmount?: string
}

const useTransactionProcess = (): TransactionHook[] | undefined => {
    const transactions = useSelector(SelectTransactions);
    const currencies = useSelector((state: RootState) => state.currencyandbalance.celoCoins);
    //const storage = useSelector((state: RootState) => state.storage.user);
    const selectedAccount = useSelector(SelectSelectedAccount);

    return useMemo(() => {
        if (transactions) {

            const res = lodash.groupBy(transactions.result, lodash.iteratee('blockNumber'))
            let newObject: { [name: string]: Transactions[] } = {}
            Object.entries(res).map(([key, value]) => {
                const data = _(value).orderBy((o) => BigInt(o.value), ['desc']).uniqBy('hash').value()
                newObject[key] = data
            })

            const transactionData = newObject;

            const result = Object.values(transactionData).reverse().filter(w=>w && w.length > 0).map((transaction, index) => {
                let amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum, outputCoin, outputAmount;
                if (transaction[0].from.toLowerCase() !== selectedAccount.toLowerCase()) {
                    transaction = transaction.filter(w => w.to.toLowerCase() === selectedAccount.toLowerCase())
                }
                if(transaction.length == 0){
                    return null;
                }

                rawDate = transaction[0]?.timeStamp;
                blockNum = transaction[0]?.blockNumber;
                if (transaction.length === 1) {
                    const tx = transaction[0]
                    hash = tx.blockNumber
                    amount = parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(2)
                    coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === tx.tokenSymbol)![1]];
                    coinName = coin.name;
                    direction = tx.input.startsWith("0x38ed1739") ? TransactionDirection.Swap : tx.from.trim().toLowerCase() === selectedAccount.trim().toLowerCase() ? TransactionDirection.Out : TransactionDirection.In
                    date = dateFormat(new Date(parseInt(tx.timeStamp) * 1e3), "mediumDate")
                    if(direction == TransactionDirection.Swap) {
                        outputCoin = Object.values(Coins).find((w: AltCoins) => w.contractAddress.toLowerCase().includes(tx.input.substring(tx.input.length - 40).toLowerCase()))?.name;
                        outputAmount = Web3.utils.fromWei(Web3.utils.toBN(tx.input.substring(74,74+64)), 'ether');
                        outputAmount = parseFloat(outputAmount).toFixed(4);
                        
                    }
                    amountUSD = direction !== TransactionDirection.Swap ? (currencies[coin.name]?.price ?? 0) * parseFloat(parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(4)) : -1
                    surplus = direction === TransactionDirection.In ? '+' : '-'
                    type = TransactionDirection.Swap !== direction ? direction === TransactionDirection.In ? TransactionType.IncomingPayment : TransactionType.QuickTransfer : TransactionType.Swap
                } else {
                    const tx = transaction;
                    const isTo = [...new Set(transaction.map(w => w.to))].length === 1 && transaction[0].from.toLowerCase() !== selectedAccount.toLowerCase();
                    hash = tx[0].blockNumber
                    amount = parseFloat(Web3.utils.fromWei(tx.reduce((a, c) => a + parseFloat(c.value), 0).toString(), 'ether')).toFixed(2)
                    coinName = tx.reduce((a, item, index, arr) => {
                        const coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === item.tokenSymbol)![1]].name
                        if (!a.includes(coin)) {
                            a += `${coin}, `;
                        }

                        return a
                    }, '')
                    if (coinName.includes(','))
                        coinName = coinName.slice(0, -2);
                    direction = isTo ? TransactionDirection.In : TransactionDirection.Out
                    date = dateFormat(new Date(parseInt(tx[0].timeStamp) * 1e3), "mediumDate")
                    amountUSD = tx.reduce((a, c) => {
                        const coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === c.tokenSymbol)![1]]
                        a += (currencies[coin.name]?.price ?? 0) * parseFloat(parseFloat(Web3.utils.fromWei(c.value, 'ether')).toFixed(4))
                        return a;
                    }, 0)
                    surplus = isTo ? '+' : '-'
                    type = isTo ? TransactionType.MassPayment : TransactionType.MassPayout
                }
                return { amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum, outputCoin, outputAmount }
            })

            return (result.filter(w => w !== null) as TransactionHook[])
        };
    }, [transactions])
}
export default useTransactionProcess;