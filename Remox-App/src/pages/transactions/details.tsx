import dateFormat from "dateformat";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import Web3 from "web3";
import Dropdown from "../../components/dropdown";
import { useLazyGetTransactionsQuery } from "../../redux/api";
import { useAppSelector } from "../../redux/hooks";
import { SelectCurrencies } from "../../redux/reducers/currencies";
import { selectStorage } from "../../redux/reducers/storage";
import { Coins, CoinsURL, TransactionFeeTokenName } from "../../types/coins";
import { DropDownItem } from "../../types/dropdown";
import lodash from "lodash";
import { Transactions } from "../../types/sdk";
import _ from "lodash";

const Details = () => {
    const storage = useAppSelector(selectStorage);
    const currencies = useAppSelector(SelectCurrencies)
    const params = useParams<{ id: string }>()

    const [totalAmount, setTotalAmount] = useState<number>();
    const [transactionFee, setTransactionFee] = useState<number>();

    const [list, setList] = useState<{ [name: string]: Transactions[] }>()
    const [trigger, { data: transactions }] = useLazyGetTransactionsQuery()

    useEffect(() => {
        if (storage?.accountAddress) {
            trigger(storage.accountAddress)
        }
    }, [])

    useEffect(() => {
        if (transactions?.result) {
            try {
                const res = lodash.groupBy(transactions.result, lodash.iteratee('blockNumber'))
                let newObject: { [name: string]: Transactions[] } = {}
                Object.entries(res).map(([key, value]) => {
                    const data = _(value).orderBy((o) => BigInt(o.value), ['desc']).uniqBy('hash').value()
                    newObject[key] = data
                })
                setList(newObject)
            } catch (error) {
                console.error(error)
            }
        }

    }, [transactions?.result])


    useEffect(() => {
        if (list) {
            if (list[params.id][0].from.toLowerCase() !== storage?.accountAddress.toLowerCase()) {
                const maTx = list[params.id].find(w => w.to.toLowerCase() === storage?.accountAddress.toLowerCase())
                if (maTx) {
                    const coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === maTx.tokenSymbol)![1]]
                    setTotalAmount(lodash.round((currencies[coin.name]?.price ?? 0) * Number(Web3.utils.fromWei(maTx.value, 'ether'))))

                    setTransactionFee(Number(Web3.utils.fromWei((Number(maTx.gasUsed) * Number(maTx.gasPrice)).toString(), 'ether')))
                }
            } else {
                const total = lodash.round(list[params.id].reduce((a, c) => {
                    const coin = Coins[Object.entries(TransactionFeeTokenName).find(w => w[0] === c.tokenSymbol)![1]]
                    a += (currencies[coin.name]?.price ?? 0) * Number(Web3.utils.fromWei(c.value, 'ether'))
                    return a;
                }, 0), 6)
                setTotalAmount(total)

                const fee = list[params.id].reduce((a, c) => {
                    a += Number(Web3.utils.fromWei((Number(c.gasUsed) * Number(c.gasPrice)).toString(), 'ether'))
                    return a
                }, 0)

                setTransactionFee(fee)
            }
        }
    }, [list])

    return <>
        <div>
            <div className="w-full shadow-custom px-5 py-14 rounded-xl flex flex-col">
                <div className="font-bold text-xl sm:text-2xl">
                    Transaction Details
                </div>
                {list ? <div className="flex flex-col sm:grid sm:grid-cols-3 py-5 gap-14">
                    {list[params.id].length === 1 || list[params.id][0].from.toLowerCase() !== storage?.accountAddress.toLowerCase() ?
                        TransactionDetailInput("Transaction Hash", `${list[params.id][0].hash}`, `https://explorer.celo.org/tx/${list[params.id][0].hash}/token-transfers`)
                        :
                        <Dropdown displayName="Transaction Hash" className="h-full bg-greylish bg-opacity-10 font-semibold" onSelect={(w: DropDownItem) => {
                            window.open(`https://explorer.celo.org/tx/${w.name}/token-transfers`, '_blank')
                        }} nameActivation={true} selected={{ name: "Go to Explorer", coinUrl: CoinsURL.None }} list={[
                            ...list[params.id].map(w => ({ name: w.hash, coinUrl: CoinsURL.None })),
                        ]} />
                    }
                    {TransactionDetailInput("Paid To", list[params.id].length === 1 || list[params.id][0].from.toLowerCase() !== storage?.accountAddress.toLowerCase() ? `1 person` : `${list[params.id].length} people`)}
                    {TransactionDetailInput("Total Amount", `${totalAmount} USD`)}
                    {TransactionDetailInput("Transaction Fee", `${transactionFee}`)}
                    {TransactionDetailInput("Created Date & Time", `${dateFormat(new Date(Number(list[params.id][0].timeStamp) * 1e3), 'dd/mm/yyyy hh:MM:ss')}`)}
                    {TransactionDetailInput("Status", "Completed")}
                    {list[params.id][0].from.toLowerCase() !== storage?.accountAddress.toLowerCase() ?
                        TransactionDetailInput("Wallet Address",
                            list[params.id][0].from.split('').reduce((a, c, i, arr) => {
                                return i < 10 || (arr.length - i) < 4 ? a + c : a.split('.').length - 1 < 6 ? a + '.' : a
                            }, '')
                        )
                        :
                        <Dropdown displayName="Wallet Address" className="h-[75px] bg-greylish bg-opacity-10" nameActivation={true} selected={{ name: "Choose to copy an address", coinUrl: CoinsURL.None }}
                            onSelect={(w: DropDownItem) => {
                                if (w.name) window.navigator.clipboard.writeText(w.name)
                            }}
                            list={[
                                ...list[params.id].map(w => ({ name: w.to, coinUrl: CoinsURL.None, disableAddressDisplay: true })),
                            ]} />}
                </div> : <ClipLoader />}
            </div>
        </div>
    </>
}

export default Details;


const TransactionDetailInput = (title: string, children: JSX.Element | JSX.Element[] | string, url?: string) => {

    return <div className="bg-greylish bg-opacity-10 flex flex-col px-4 py-3 rounded-xl min-h-[75px]">
        <div className="text-sm text-greylish opacity-80">
            {title}
        </div>
        <div className={`font-bold text-lg truncate ${url && "cursor-pointer"}`} onClick={() => {
            url ? window.open(url, '_blank') : console.log("Wish you more money :)")
        }}>
            {children}
        </div>
        { }
    </div>
}