import TransactionItem from "../../transactionItem";
import { Link } from "react-router-dom";
import { generate } from "shortid";
import _ from "lodash";
import { TransactionHook, TransactionHookByDate, TransactionHookByDateInOut } from '../../../hooks/useTransactionProcess'
import { Fragment, useEffect } from "react";
import Accordion from "../accordion";
import { TransactionDirection, TransactionStatus } from "../../../types";
import { Coins } from "../../../types/coins";


const TransactionHistory = ({ transactions }: { transactions: TransactionHook[] | TransactionHookByDateInOut }) => {

    let index = 0;

    return <div className="flex flex-col shadow-custom max-h-full px-5 pt-5 pb-4 rounded-xl">
        <div className="flex justify-between">
            <div className="font-semibold text-lg text-black tracking-wide">Recent Transactions</div>
            <div><Link to="/dashboard/transactions" className="text-primary border border-primary px-10 py-2 rounded-xl">View All</Link></div>
        </div>
        <div className="grid grid-cols-1 pt-5">
            {transactions && !Array.isArray(transactions) && Object.entries(transactions).map(([date, transactionObj]) => {
                const recievedTransactions = transactionObj.recieved;
                const sentTransactions = transactionObj.sent;
                return <Fragment key={generate()}>
                    {index < 6 && recievedTransactions.length > 0 && ++index && <Accordion direction={TransactionDirection.In} date={date} dataCount={recievedTransactions.length} status={TransactionStatus.Completed}>
                        <div>
                            {recievedTransactions.map(({ amount, address, coinName, blockNumber, date, coin}) => {
                                return <TransactionItem key={generate()} hash={blockNumber} address={address} amountCoin={amount} date={date} coinName={coinName} coin={coin}  status={TransactionStatus.Completed} />
                            })}
                        </div>
                    </Accordion>}
                    {index < 6 && sentTransactions.length > 0 && ++index && <Accordion direction={TransactionDirection.Out} date={date} dataCount={sentTransactions.length} status={TransactionStatus.Completed}>
                        <div>
                            {sentTransactions.map(({ amount, coinName, blockNumber, address, date, coin }) => {
                                return <TransactionItem key={generate()} hash={blockNumber} address={address} date={date} amountCoin={amount} coinName={coinName} coin={coin} status={TransactionStatus.Completed} />
                            })}
                        </div>
                    </Accordion>}
                </Fragment>
            })}
        </div>
    </div>

}



export default TransactionHistory;