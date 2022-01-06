import { ClipLoader } from 'react-spinners';
import TransactionHistory from '../../components/dashboard/main/transactionHistory'
import Statistics from '../../components/dashboard/main/statistics'
import useTransactionProcess from '../../hooks/useTransactionProcess';


const Main = () => {
    const transactions = useTransactionProcess()
    
    return <main className="grid grid-cols-1 xl:grid-cols-2 w-full gap-5">
        <div className="grid grid-cols-2 gap-8">
            <Statistics />
        </div>
        <div id="transaction" className="pb-14 pt-[30px]">
            {transactions ? <TransactionHistory transactions={transactions} /> : <div className="flex justify-center"> <ClipLoader /></div>}
        </div>
    </main>
}

export default Main;