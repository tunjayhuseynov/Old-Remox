import { ClipLoader } from 'react-spinners';
import TransactionHistory from '../../components/dashboard/main/transactionHistory'
import Statistics from '../../components/dashboard/main/statistics'
import useTransactionProcess, { TransactionHook, TransactionHookByDate, TransactionHookByDateInOut } from '../../hooks/useTransactionProcess';
import { useEffect, useRef, useState } from 'react';


const Main = () => {
    const [transactions] = useTransactionProcess(true)

    return <main className="flex gap-5">
        <div className="w-1/2">
            <div className="grid grid-cols-2 gap-8 max-h-full">
                <Statistics />
            </div>
        </div>
        <div className=" w-1/2">
            <div id="transaction" className=" pt-[30px]">
                {transactions ? <TransactionHistory transactions={transactions} /> : <div className="flex justify-center"> <ClipLoader /></div>}
            </div>
        </div>
    </main>
}

export default Main;