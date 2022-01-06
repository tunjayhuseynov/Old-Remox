import { TransactionStatus } from "../../../types/dashboard/transaction";
import TransactionItem from "../../transactionItem";
import { Link } from "react-router-dom";
import { generate } from "shortid";
import _ from "lodash";
import { TransactionHook } from '../../../hooks/useTransactionProcess'

const TransactionHistory = ({ transactions }: { transactions: TransactionHook[] }) => {

    return <div className="flex flex-col shadow-custom max-h-full px-5 pt-5 pb-14 rounded-xl">
        <div className="flex justify-between">
            <div className="font-medium text-xl text-greylish tracking-wide">Recent Transactions</div>
            <div><Link to="/dashboard/transactions" className="text-blue-400">View All</Link></div>
        </div>
        <div className="grid grid-cols-1">
            {transactions && transactions.slice(0, 4).map(({ hash, amount, coinName, type, direction, date, surplus, amountUSD }) => <TransactionItem key={generate()} hash={hash} amountCoin={`${amount} ${coinName}`} type={type} direction={direction} date={date} amountUSD={amountUSD !== -1 ? `${surplus}${amountUSD.toFixed(3)}$` : ''} status={TransactionStatus.Completed} />)}
        </div>
    </div>

}



export default TransactionHistory;