import { useEffect, useRef, useState } from "react";
import { IoIosSwap } from "react-icons/io";
import { Link } from "react-router-dom";
import { TransactionType, TransactionStatus, TransactionDirection } from "../types/dashboard/transaction"

const TransactionItem = ({ type, direction, date, amountUSD, status, amountCoin, hash, outputCoin }: { hash: string, type: TransactionType, direction: TransactionDirection, date: string, amountUSD: string, amountCoin: string, status: TransactionStatus, outputCoin?: string }) => {

    const [detect, setDetect] = useState(true);
    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (divRef.current && window.outerWidth / divRef.current.clientWidth > 3) {
            setDetect(false)
        }
    }, [])

    return <div ref={divRef} className={`grid ${detect ? 'grid-cols-[25%,45%,30%] sm:grid-cols-[45%,25%,15%,15%] pl-5' : 'grid-cols-[1.9fr,1fr,1fr]'} min-h-[115px] py-6 border-b border-black `}>
        <div className="flex space-x-5">
            <div className="flex items-center justify-center">
                <div className="bg-greylish bg-opacity-10 w-[40px] h-[40px] flex items-center justify-center rounded-full">
                    {
                        TransactionDirection.Swap === direction ?
                            <IoIosSwap />
                            :
                            TransactionDirection.Out === direction ? <img src="/icons/uparrow.svg" alt="" className="w-[25px] h-[25px]" /> : <img src="/icons/uparrow.svg" className="rotate-180" alt="" />
                    }
                </div>
            </div>
            <div className="hidden sm:flex flex-col items-start justify-between">
                <div className="text-greylish">
                    <span> {type} </span>
                </div>
                <div className="text-sm text-greylish">
                    {date}
                </div>
            </div>
        </div>
        <div className={`flex flex-col justify-between ${detect ? 'items-left' : 'items-center'} text-greylish`}>
            <div>
                {amountCoin}
            </div>
            <div className="text-sm">
                {amountUSD}
            </div>
        </div>
        <div className={`md:flex items-center hidden ${detect ? 'justify-start' : 'justify-end'}`}>
            {TransactionStatus.Completed === status ? <span className="text-green-400">Completed</span> : null}
        </div>
        {detect &&
            <div className="flex flex-col justify-center cursor-pointer text-blue-400 items-end pr-5 md:pr-0 lg:pr-5">
                <Link to={`/dashboard/transactions/${hash}`}>View</Link>
            </div>
        }
    </div>
}

export default TransactionItem;