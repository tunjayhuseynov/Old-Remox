import { useEffect, useRef, useState } from "react";
import { IoIosSwap } from "react-icons/io";
import { Link } from "react-router-dom";
import { generate } from "shortid";
import { AltCoins, AltcoinsList, Coins } from "../types/coins";
import { TransactionType, TransactionStatus, TransactionDirection } from "../types/dashboard/transaction"
import { AddressReducer } from "../utility";

const TransactionItem = ({ type, direction, date, amountUSD, status, amountCoin, coinName, hash, address, coin }: { hash: string, type?: TransactionType, direction?: TransactionDirection, date: string, amountUSD?: string, amountCoin: string[], status: TransactionStatus, outputCoin?: string, address?: string, coin: AltCoins[], coinName: string[] }) => {

    const [detect, setDetect] = useState(true);
    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (divRef.current && window.outerWidth / divRef.current.clientWidth > 3) {
            setDetect(false)
        }
    }, [])

    return <div ref={divRef} className={`grid ${detect ? 'grid-cols-[25%,45%,30%] sm:grid-cols-[25%,35%,20%,20%] pl-5' : 'grid-cols-[35%,40%,25%]'} min-h-[75px] py-4 `}>
        <div className="flex space-x-3">
            <div className={`hidden sm:flex ${detect ? "items-center":"items-start"} pt-3 justify-center`}>
                <div className={`bg-greylish bg-opacity-10 ${detect ? "w-[45px] h-[45px] text-lg" : "w-[25px] h-[25px] text-xs"} flex items-center justify-center rounded-full font-bold `}>
                    Un
                </div>
            </div>
            <div className={`sm:flex flex-col ${detect ? "justify-center":"justify-start"} items-start `}>
                <div className="text-greylish">
                    <span> Unknown </span>
                </div>
                {address && <div className="text-sm text-greylish">
                    {AddressReducer(address)}
                </div>}
            </div>
        </div>
        <div className="text-base">
            <div>
                {amountCoin.map((s, i) => <div key={generate()} className={`grid ${detect ? "grid-cols-[20%,80%]": "grid-cols-[45%,55%]"} items-center mx-7 gap-x-1`}>
                    <div className={`grid ${detect? "grid-cols-[15%,85%]":"grid-cols-[25%,75%]"} gap-x-1 items-center`}>
                        <div className="w-[10px] h-[10px] rounded-full bg-primary space-x-3 self-center">
                        </div>
                        <span>
                            {s}
                        </span>
                    </div>
                    <div className={`grid ${detect ? "grid-cols-[10%,90%]": "grid-cols-[30%,70%]"} gap-x-1 items-center`}>
                        <div>
                            <img src={coin[i].coinUrl} className="rounded-full w-[18px] h-[18x]" />
                        </div>
                        <div>
                            {coinName[i]}
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
        {detect && <div></div>}
        <div className="flex justify-end cursor-pointer  items-start md:pr-0 ">
            <Link to={`/dashboard/transactions/${hash}`}><div className={`text-primary  ${detect ? "px-8 max-h-[80px] border-2 border-primary lg:pr-5" : "text-sm pr-4"} rounded-xl py-2`}>View Details</div></Link>
        </div>
    </div>
}

export default TransactionItem;