import dateFormat from "dateformat";
import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import { generate } from "shortid";
import Web3 from "web3";
import TransactionItem from "../../components/transactionItem";
import { useLazyGetTransactionsQuery } from "../../redux/api";
import { useAppSelector } from "../../redux/hooks";
import { selectStorage } from "../../redux/reducers/storage";
import { AltCoins, Coins, TransactionFeeTokenName } from "../../types/coins";
import { TransactionStatus } from "../../types/dashboard/transaction";
import { CSVLink } from "react-csv";
import _ from "lodash";
import useTransactionProcess from "../../hooks/useTransactionProcess";
import { SelectSelectedAccount } from "../../redux/reducers/selectedAccount";
import useMultisig from "../../hooks/useMultisig";
import { selectMultisigTransactions } from "../../redux/reducers/multisig";
import { Link } from "react-router-dom";


const Transactions = () => {
    const storage = useAppSelector(selectStorage);
    const selectedAccount = useAppSelector(SelectSelectedAccount)
    const multisigData = useAppSelector(selectMultisigTransactions)

    const { refetch, fetchTxs, isMultisig, data, signData, isTransactionLoading } = useMultisig()

    const [take, setTake] = useState(4)
    const [trigger, { data: transactions }] = useLazyGetTransactionsQuery()
    const list = useTransactionProcess()

    const [multiSkip, setMultiSkip] = useState(0)

    useEffect(() => {
        if (storage?.accountAddress && !isMultisig) {
            trigger(storage.accountAddress)
            const interval = setInterval(() => {
                trigger(storage.accountAddress)
            }, 10000)
            return () => clearInterval(interval)
        } else if (isMultisig) {
            const interval = setInterval(() => {
                refetch(true, 0, (multisigData?.length || 20))
            }, 30000)
            return () => clearInterval(interval)
        }
    }, [selectedAccount, multisigData])

    return <>
        <div>
            <div className="w-full shadow-custom px-5 pt-4 pb-3 rounded-xl">
                <div id="header" className="grid grid-cols-[25%,45%,30%] sm:grid-cols-[45%,25%,15%,15%] border-b border-black pb-5 pl-5" >
                    <div className="sm:hidden text-xs font-semibold">Recent</div>
                    <div className="hidden sm:block text-xs sm:text-base font-semibold">{isMultisig ? "Your Confirmation" : "Recent Transactions"}</div>
                    <div className="text-xs sm:text-base font-semibold">{isMultisig ? "Action" : "Total Amount"}</div>
                    <div className="font-semibold hidden md:block">{isMultisig ? "Signatures" : "Status"}</div>
                    {!isMultisig && <> <div className="place-self-end ">
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
                    </div></>}
                </div>
                {!isMultisig && <> <div>
                    {list ? list.slice(0, take).map(({ hash, amount, coinName, type, direction, date, surplus, amountUSD, outputCoin, outputAmount }) => <TransactionItem key={generate()} hash={hash} amountCoin={`${amount} ${coinName}`} type={type} direction={direction} date={date} amountUSD={amountUSD !== -1 ? `${surplus} ${amountUSD.toFixed(3)} $` : `${outputCoin && outputAmount ? `to ${outputAmount} ${outputCoin}` : ''}`} status={TransactionStatus.Completed} />
                    ) : <div className="text-center"><ClipLoader /></div>}
                </div>
                    {transactions && list && take < transactions.result.length && take < Object.values(list).length && <div className="flex justify-center pt-4">
                        <button className="text-primary px-5 py-3 rounded-xl border border-primary" onClick={() => {
                            if (transactions.result.length - take < 4) {
                                setTake(transactions.result.length - (transactions.result.length - take))
                            } else {
                                setTake(take + 4 < transactions.result.length ? take + 4 : transactions.result.length)
                            }
                        }}>
                            Load More
                        </button>
                    </div>}
                </>}
                {
                    isMultisig && <div>
                        {multisigData ?
                            multisigData.length > 0 ? <>
                                {multisigData.filter(w => w.method).map((w, i) => <div key={generate()} className="pl-5 grid grid-cols-[45%,25%,15%,15%] min-h-[75px] py-6 border-b border-black items-center">
                                    <div>
                                        {w.executed ? <div className="text-white bg-green-500 border-2 border-green-500 rounded-xl px-3 py-1 text-center text-xs w-[125px]">Submitted</div> : null}
                                        {w.executed ? null : w.confirmations.includes(storage!.accountAddress) ? <div className="text-white bg-primary border-2 border-primary rounded-xl px-3 py-1 text-center text-xs w-[125px]">Confirmed</div> : <div className="border-2 text-center border-primary  px-3 py-1 rounded-xl text-xs w-[125px]">Not confirmed yet</div>}
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <div>
                                            <div className="border-b border-black inline">
                                                {w.method!.split('').reduce((acc, w, i) => {
                                                    if (i === 0) return acc + w.toUpperCase()
                                                    if (w !== w.toLowerCase() && i > 0) return acc + " " + w
                                                    return acc + w;
                                                }, '')}
                                            </div>
                                        </div>
                                        {w.owner ? <div className="truncate pr-10 text-xs">{w.method?.toLowerCase().includes('transfer') ? 'To' : 'Owner'}: {w.owner}</div> : null}
                                        {w.valueOfTransfer ? <div className="truncate pr-10 text-xs">Value: {w.valueOfTransfer} {(Object.values(Coins).find((s: AltCoins) => s.contractAddress.toLowerCase() === w.destination.toLowerCase()) as AltCoins)?.name}</div> : null}
                                        {w.newOwner ? <div className="truncate pr-10 text-xs">New Owner: {w.newOwner}</div> : null}
                                        {w.requiredCount ? <div className="truncate pr-10 text-xs">New Signature Threshold: {+w.requiredCount}</div> : null}
                                    </div>
                                    <div className="font-semibold ">
                                        {w.confirmations.length} <span className="font-medium">out of</span> {w.method?.toLowerCase().includes("transfer") ? signData?.executinTransactions : signData?.changingMultiSigProperties}
                                    </div>
                                    <div className="flex flex-col justify-center cursor-pointer text-blue-400 items-end pr-5 md:pr-0 lg:pr-5">
                                        <Link to={`/multisig/${w.id}`}>View</Link>
                                    </div>
                                </div>)}

                            </> : <div className="flex flex-col justify-center">
                                <div className="text-center py-3"><ClipLoader /></div>
                                <div className="text-center text-xs text-gray-500">It can take longer</div>
                            </div> : <div className="text-center py-3">No Transaction Yet</div>}

                        {multisigData && multisigData.length > 0 && (!multisigData.some(s => s.id === 1)) && <div className="flex justify-center py-4"> <button className="text-primary px-5 py-3 rounded-xl border border-primary" onClick={() => {
                            setMultiSkip((multisigData?.length ?? 0))
                            fetchTxs(true, (multisigData?.length ?? 0))
                        }}>
                            {isTransactionLoading ? <div> <ClipLoader /> </div> : "Load More"}
                        </button></div>}
                    </div>
                }
            </div>
        </div>
    </>
}

export default Transactions;