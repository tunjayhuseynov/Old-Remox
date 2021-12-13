import dateFormat from "dateformat";
import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import { generate } from "shortid";
import Web3 from "web3";
import TransactionItem from "../../components/transactionItem";
import { useLazyGetTransactionsQuery } from "../../redux/api";
import { useAppSelector } from "../../redux/hooks";
import { SelectCurrencies } from "../../redux/reducers/currencies";
import { selectStorage } from "../../redux/reducers/storage";
import { Coins, TransactionFeeTokenName } from "../../types/coins";
import { TransactionDirection, TransactionStatus, TransactionType } from "../../types/dashboard/transaction";
import { CSVLink } from "react-csv";
import lodash from "lodash";
import { Transactions as transactionType } from "../../types/sdk";
import _ from "lodash";
import useTransactionProcess from "../../hooks/useTransactionProcess";


const Transactions = () => {
    const storage = useAppSelector(selectStorage);

    const [take, setTake] = useState(4)
    const [trigger, { data: transactions }] = useLazyGetTransactionsQuery()
    const list = useTransactionProcess()

    useEffect(() => {
        if (storage?.accountAddress) {
            trigger(storage.accountAddress)
            const interval = setInterval(() => {
                trigger(storage.accountAddress)
            }, 10000)
            return () => clearInterval(interval)
        }
    }, [])

    return <>
        <div>
            <div className="w-full shadow-custom px-5 pt-4 pb-6 rounded-xl">
                <div id="header" className="grid grid-cols-[25%,45%,30%] sm:grid-cols-[45%,25%,15%,15%] border-b border-black pb-5 pl-5" >
                    <div className="sm:hidden text-xs font-semibold">Recent</div>
                    <div className="hidden sm:block text-xs sm:text-base font-semibold">Recent Transactions</div>
                    <div className="text-xs sm:text-base font-semibold">Total Amount</div>
                    <div className="font-semibold hidden md:block">Status</div>
                    <div className="place-self-end ">
                        {transactions && <CSVLink className="font-normal px-2 sm:px-5 py-1 rounded-md cursor-pointer bg-greylish bg-opacity-20 flex items-center justify-center xl:space-x-5" filename={"remox_transactions.csv"} data={transactions.result.map(w => ({
                            'Sent From:': w.from,
                            'Amount:': parseFloat(Web3.utils.fromWei(w.value, 'ether')).toFixed(4) + ` ${Coins[Object.entries(TransactionFeeTokenName).find(s => s[0] === w.tokenSymbol)![1]].name}`,
                            'To:': w.to,
                            'Date': dateFormat(new Date(parseInt(w.timeStamp) * 1e3), "mediumDate"),
                            "Gas": parseFloat(w.gasUsed) * parseFloat(w.gasPrice),
                            "Block Number": w.blockNumber,
                            "Transaction Hash": w.hash,
                            "Block Hash": w.blockHash,
                            "Input": w.input
                        }))}>
                            <div className={'hidden xl:block'}>Export</div>
                            <img src="/icons/downloadicon.svg" alt="" />
                        </CSVLink>}
                    </div>
                </div>
                <div>
                    {list ? list.slice(0, take).map(({ hash, amount, coinName, type, direction, date, surplus, amountUSD }) => <TransactionItem key={generate()} hash={hash} amountCoin={`${amount} ${coinName}`} type={type} direction={direction} date={date} amountUSD={`${surplus} ${amountUSD.toFixed(3)} $`} status={TransactionStatus.Completed} />
                    ) : <div className="text-center"><ClipLoader /></div>}
                </div>
                {list && take < 100 && take < Object.values(list).length && <div className="flex justify-center py-4">
                    <button className="text-primary px-5 py-3 rounded-xl border border-primary" onClick={() => {
                        if (100 - take < 4) {
                            setTake(100 - (100 - take))
                        } else {
                            setTake(take + 4 < 100 ? take + 4 : 100)
                        }
                    }}>
                        Load More
                    </button>
                </div>}
            </div>
        </div>
    </>
}

export default Transactions;