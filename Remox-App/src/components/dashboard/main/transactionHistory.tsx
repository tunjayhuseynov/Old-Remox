import { TransactionDirection, TransactionStatus, TransactionType } from "../../../types/dashboard/transaction";
import TransactionItem from "../../transactionItem";
import dateFormat from "dateformat";
import { Link } from "react-router-dom";
import { generate } from "shortid";
import Web3 from 'web3'
import { Coins, TransactionFeeTokenName } from "../../../types/coins";
import { selectStorage } from "../../../redux/reducers/storage";
import { useAppSelector } from "../../../redux/hooks";
import { SelectCurrencies } from "../../../redux/reducers/currencies";
import { Transactions } from "../../../types/sdk";
import lodash from "lodash";
import { useEffect, useState } from "react";
import _ from "lodash";

const TransactionHistory = ({ transactions }: { transactions: Transactions[] }) => {
    const storage = useAppSelector(selectStorage)
    const currencies = useAppSelector(SelectCurrencies)

    const [transactionData, setTransactionData] = useState<{ [name: string]: Transactions[] }>()

    useEffect(() => {
        if (transactions) {
            const res = lodash.groupBy(transactions, lodash.iteratee('blockNumber'))
            let newObject: { [name: string]: Transactions[] } = {}
            Object.entries(res).map(([key, value]) => {
                const data = _(value).orderBy((o) => BigInt(o.value), ['desc']).uniqBy('hash').value()
                newObject[key] = data
            })
            setTransactionData(newObject)
        }
    }, [transactions])

    return <div className="flex flex-col shadow-custom max-h-full px-5 pt-5 pb-14 rounded-xl">
        <div className="flex justify-between">
            <div className="font-medium text-xl text-greylish tracking-wide">Recent Transactions</div>
            <div><Link to="/dashboard/transactions" className="text-blue-400">View All</Link></div>
        </div>
        <div className="grid grid-cols-1">
            {transactionData && Object.values(transactionData).reverse().slice(0,4).map((transaction, index) => {
                let amount, coin, coinName, direction, date, amountUSD, surplus, type, hash;
                if(transaction[0].from.toLowerCase() !== storage?.accountAddress.toLowerCase()){
                    transaction = transaction.filter(w=>w.to.toLowerCase() === storage?.accountAddress.toLowerCase())
                }
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
                } else if (transaction.length > 1) {
                    const tx = transaction;
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
                    direction = TransactionDirection.Out
                    date = dateFormat(new Date(parseInt(tx[0].timeStamp) * 1e3), "mm/dd/yyyy hh:MM:ss")
                    amountUSD = tx.reduce((a, c) => {
                        const coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === c.tokenSymbol)![1]]
                        a += (currencies[coin.name]?.price ?? 0) * parseFloat(parseFloat(Web3.utils.fromWei(c.value, 'ether')).toFixed(4))
                        return a;
                    }, 0)
                    surplus = '-'
                    type = TransactionType.MassPayout
                } else return <></>
                return <TransactionItem key={generate()} hash={hash} amountCoin={`${amount} ${coinName}`} type={type} direction={direction} date={date} amountUSD={`${surplus}${amountUSD.toFixed(3)}$`} status={TransactionStatus.Completed} />
            })}
        </div>
    </div>

}

export default TransactionHistory;