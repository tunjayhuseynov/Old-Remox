import { useEffect, useRef, useState } from "react";
import { IoIosSwap } from "react-icons/io";
import { Link } from "react-router-dom";
import { generate } from "shortid";
import { AltCoins, AltcoinsList, Coins } from "../types/coins";
import { TransactionType, TransactionStatus, TransactionDirection } from "../types/dashboard/transaction"
import { AddressReducer } from "../utility";

const TransactionItem = ({ type, direction, date, amountUSD, status, amountCoin, coinName, blockNumber, address, coin, swap }: { blockNumber: string, type?: TransactionType, direction?: TransactionDirection, date?: string, amountUSD?: string, amountCoin: string[], status: TransactionStatus, address?: string, coin: AltCoins[], coinName: string[], swap?: { outputCoin: AltCoins, outputCoinName: string, outputAmount: string, inputCoin: AltCoins, inputCoinName: string, inputAmount: string } }) => {

    const [detect, setDetect] = useState(true);
    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (divRef.current && window.outerWidth / divRef.current.clientWidth > 3) {
            setDetect(false)
        }
    }, [])

    const isSwap = direction !== TransactionDirection.Swap;

    return <div ref={divRef} className={`grid ${detect ? 'grid-cols-[25%,45%,30%] sm:grid-cols-[25%,35%,20%,20%] pl-5' : 'grid-cols-[35%,40%,25%]'} min-h-[75px] py-4 `}>
        <div className="flex space-x-3">
            <div className={`hidden sm:flex ${detect ? "items-center" : "items-start"} pt-3 justify-center`}>
                <div className={`bg-greylish bg-opacity-10 ${detect ? "w-[45px] h-[45px] text-lg" : "w-[25px] h-[25px] text-xs"} flex items-center justify-center rounded-full font-bold `}>
                    {isSwap ? <span> Un </span> : <span> S </span>}
                </div>
            </div>
            <div className={`sm:flex flex-col ${detect ? "justify-center" : "justify-start"} items-start `}>
                <div className="text-greylish">
                    {isSwap ? <span> Unknown </span> : <span> Swap </span>}
                </div>
                {address && isSwap && <div className="text-sm text-greylish">
                    {AddressReducer(address)}
                </div>}
            </div>
        </div>
        <div className="text-base">
            <div>
                {isSwap && amountCoin.map((s, i) => <div key={generate()} className={`flex ${detect ? "grid-cols-[20%,80%]" : "grid-cols-[45%,55%]"} items-center mx-7 space-x-4`}>
                    <div className={`flex ${detect ? "grid-cols-[15%,85%]" : "grid-cols-[25%,75%]"} gap-x-2 items-center`}>
                        <div className="w-[10px] h-[10px] rounded-full bg-primary self-center">
                        </div>
                        <span>
                            {s}
                        </span>
                    </div>
                    <div className={`flex ${detect ? "grid-cols-[10%,90%]" : "grid-cols-[30%,70%]"} gap-x-2 items-center`}>
                        <div>
                            <img src={coin[i].coinUrl} className="rounded-full w-[18px] h-[18x]" />
                        </div>
                        <div>
                            {coinName[i]}
                        </div>
                    </div>
                </div>
                )}
                {direction === TransactionDirection.Swap && swap && <div className="flex flex-col">
                    <div className={`flex ${detect ? "grid-cols-[20%,80%]" : "grid-cols-[45%,55%]"} items-center mx-7 space-x-4`}>
                        <div className={`flex ${detect ? "grid-cols-[15%,85%]" : "grid-cols-[25%,75%]"} gap-x-2 items-center`}>
                            <div className="w-[10px] h-[10px] rounded-full bg-primary self-center">
                            </div>
                            <span>
                                {swap.inputAmount}
                            </span>
                        </div>
                        <div className={`flex ${detect ? "grid-cols-[10%,90%]" : "grid-cols-[30%,70%]"} gap-x-1 items-center`}>
                            <div>
                                <img src={swap.inputCoin.coinUrl} className="rounded-full w-[18px] h-[18x]" />
                            </div>
                            <div>
                                {swap.inputCoinName}
                            </div>
                        </div>
                    </div>
                    <div className="mx-7">
                        <div className="py-1 rounded-lg -translate-x-[4px]">
                            <img src="/icons/arrowdown.svg" alt="" className="w-[18px] h-[18px]" />
                        </div>
                    </div>
                    <div className={`flex ${detect ? "grid-cols-[20%,80%]" : "grid-cols-[45%,55%]"} items-center mx-7 space-x-4`}>
                        <div className={`grid ${detect ? "grid-cols-[15%,85%]" : "grid-cols-[25%,75%]"} gap-x-2 items-center`}>
                            <div className="w-[10px] h-[10px] rounded-full bg-primary self-center">
                            </div>
                            <span>
                                {swap.outputAmount}
                            </span>
                        </div>
                        <div className={`flex ${detect ? "grid-cols-[10%,90%]" : "grid-cols-[30%,70%]"} gap-x-1 items-center`}>
                            <div>
                                <img src={swap.outputCoin.coinUrl} className="rounded-full w-[18px] h-[18x]" />
                            </div>
                            <div>
                                {swap.outputCoinName}
                            </div>
                        </div>
                    </div>
                </div>}
            </div>
        </div>
        {detect && <div></div>}
        <div className="flex justify-end cursor-pointer items-start md:pr-0 ">
            <Link to={`/dashboard/transactions/${blockNumber}/${address}`}><div className={`text-primary  ${detect ? "px-6 max-h-[80px] border-2 border-primary hover:bg-primary hover:text-white" : "text-sm"} rounded-xl py-2`}>View Details</div></Link>
        </div>
    </div>
}

export default TransactionItem;