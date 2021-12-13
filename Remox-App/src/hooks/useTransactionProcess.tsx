import { useMemo } from 'react';
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
}

const useTransactionProcess = (): TransactionHook[] | undefined => {
    const transactions = useSelector((state: RootState) => state.transactions.transactions);
    const currencies = useSelector((state: RootState) => state.currencyandbalance.celoCoins);
    const storage = useSelector((state: RootState) => state.storage.user);

    return useMemo(() => {
        if (transactions && currencies && storage) {

            const res = lodash.groupBy(transactions.result, lodash.iteratee('blockNumber'))
            let newObject: { [name: string]: Transactions[] } = {}
            Object.entries(res).map(([key, value]) => {
                const data = _(value).orderBy((o) => BigInt(o.value), ['desc']).uniqBy('hash').value()
                newObject[key] = data
            })

            const transactionData = newObject;

            return Object.values(transactionData).reverse().map((transaction, index) => {
                let amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum;
                if (transaction[0].from.toLowerCase() !== storage?.accountAddress.toLowerCase()) {
                    transaction = transaction.filter(w => w.to.toLowerCase() === storage?.accountAddress.toLowerCase())
                }
                rawDate = transaction[0].timeStamp;
                blockNum = transaction[0].blockNumber;
                if (transaction.length === 1) {
                    const tx = transaction[0]
                    hash = tx.blockNumber
                    amount = parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(2)
                    coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === tx.tokenSymbol)![1]];
                    coinName = coin.name;
                    direction = tx.from.trim().toLowerCase() === storage?.accountAddress.trim().toLowerCase() ? TransactionDirection.Out : TransactionDirection.In
                    date = dateFormat(new Date(parseInt(tx.timeStamp) * 1e3), "mediumDate")
                    amountUSD = (currencies[coin.name]?.price ?? 0) * parseFloat(parseFloat(Web3.utils.fromWei(tx.value, 'ether')).toFixed(4))
                    surplus = direction === TransactionDirection.In ? '+' : '-'
                    type = direction === TransactionDirection.In ? TransactionType.IncomingPayment : TransactionType.QuickTransfer
                } else {
                    const tx = transaction;
                    const isTo = [...new Set(transaction.map(w => w.to))].length === 1 && transaction[0].from.toLowerCase() !== storage?.accountAddress.toLowerCase();
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
                return { amount, coin, coinName, direction, date, amountUSD, surplus, type, hash, rawDate, blockNum }
            })
        };
    }, [transactions, currencies, storage])
}
export default useTransactionProcess;