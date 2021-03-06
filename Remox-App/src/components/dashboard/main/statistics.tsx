import { useEffect, useMemo, useState } from "react";
import { ClipLoader } from "react-spinners";
import { IBalanceItem, ICurrencyInternal, SelectBalances, SelectCurrencies } from '../../../redux/reducers/currencies';
import { AltCoins, Coins, TransactionFeeTokenName } from '../../../types/coins';
import { generate } from 'shortid';
import Web3 from 'web3'
import { useAppSelector } from '../../../redux/hooks';
import { selectStorage } from "../../../redux/reducers/storage";
import { SelectTransactions } from "../../../redux/reducers/transactions";
import CoinItem from '../../../components/dashboard/main/coinitem';
import { SelectSelectedAccount } from "../../../redux/reducers/selectedAccount";

interface Balance {
    amount: number,
    per_24?: number,
    percent: number,
    coins: AltCoins,
    tokenPrice: number | undefined
}

const Statistic = () => {
    const storage = useAppSelector(selectStorage)
    const selectedAccount = useAppSelector(SelectSelectedAccount)

    const transactions = useAppSelector(SelectTransactions)

    const [percent, setPercent] = useState<number>()
    const [balance, setBalance] = useState<string>()


    const [lastIn, setIn] = useState<number>()
    const [lastOut, setOut] = useState<number>();

    const [allInOne, setAllInOne] = useState<Balance[]>()


    const currencies = useAppSelector(SelectCurrencies)
    const celo = (useAppSelector(SelectCurrencies)).CELO
    const cusd = (useAppSelector(SelectCurrencies)).cUSD
    const ceur = (useAppSelector(SelectCurrencies)).cEUR
    const ube = (useAppSelector(SelectCurrencies)).UBE
    const moo = (useAppSelector(SelectCurrencies)).MOO
    const mobi = (useAppSelector(SelectCurrencies)).MOBI
    const poof = (useAppSelector(SelectCurrencies)).POOF
    const creal = (useAppSelector(SelectCurrencies)).cREAL

    const balanceRedux = useAppSelector(SelectBalances)
    const celoBalance = (useAppSelector(SelectBalances)).CELO
    const cusdBalance = (useAppSelector(SelectBalances)).cUSD
    const ceurBalance = (useAppSelector(SelectBalances)).cEUR
    const ubeBalance = (useAppSelector(SelectBalances)).UBE
    const mooBalance = (useAppSelector(SelectBalances)).MOO
    const mobiBalance = (useAppSelector(SelectBalances)).MOBI
    const poofBalance = (useAppSelector(SelectBalances)).POOF
    const crealBalance = (useAppSelector(SelectBalances)).cREAL



    const all = useMemo(() => {
        if (celoBalance !== undefined && crealBalance !== undefined && cusdBalance !== undefined && ceurBalance !== undefined && ubeBalance !== undefined && mooBalance !== undefined && mobiBalance !== undefined && poofBalance !== undefined) {
            return {
                celo: celoBalance,
                cUSD: cusdBalance,
                cEUR: ceurBalance,
                UBE: ubeBalance,
                MOO: mooBalance,
                MOBI: mobiBalance,
                POOF: poofBalance,
                cREAL: crealBalance
            }
        }
    }, [celoBalance, cusdBalance, ceurBalance, ubeBalance, mooBalance, mobiBalance, poofBalance])

    const chart = useMemo(() => {
        if (celoBalance !== undefined && crealBalance !== undefined && cusdBalance !== undefined && ceurBalance !== undefined && ubeBalance !== undefined && mooBalance !== undefined && mobiBalance !== undefined && poofBalance !== undefined) {
            const celoDeg = Math.ceil(celoBalance.percent * 3.6) 
            const cusdDeg = Math.ceil(cusdBalance.percent * 3.6) + celoDeg;
            const ceurDeg = Math.ceil(ceurBalance.percent * 3.6) + cusdDeg;
            const ubeDeg = Math.ceil(ubeBalance.percent * 3.6) + ceurDeg;
            const mooDeg = Math.ceil(mooBalance.percent * 3.6) + ubeDeg;
            const mobiDeg = Math.ceil(mooBalance.percent * 3.6) + mooDeg;
            const poofDeg = Math.ceil(poofBalance.percent * 3.6) + mobiDeg;
            const crealDeg = Math.ceil(crealBalance.percent * 3.6) + poofDeg;

            if (!celoDeg && !cusdDeg && !ceurDeg && !ubeDeg && !mooDeg && !mobiDeg && !poofDeg && !crealDeg) return `conic-gradient(#FF774E 0deg 360deg)`

            return `conic-gradient(#fbce5c 0deg ${celoDeg}deg, #46cd85 ${celoDeg}deg ${cusdDeg}deg, #040404 ${cusdDeg}deg ${ceurDeg}deg, #6D619A ${ceurDeg}deg ${ubeDeg}deg, #3288ec ${ubeDeg}deg ${mooDeg}deg, #e984a0 ${mooDeg}deg ${mobiDeg}deg, #7D72FC ${mobiDeg}deg ${poofDeg}deg, #e904a3 ${poofDeg}deg ${crealDeg}deg)`
        }
        return `conic-gradient(#FF774E 0deg 360deg)`
    }, [celoBalance, cusdBalance, ceurBalance, ubeBalance, mooBalance, mobiBalance, poofBalance, celo, cusd, ceur, ube, moo, mobi, poof, creal])




    useEffect(() => {
        if (celoBalance && cusdBalance && ceurBalance && ubeBalance && mooBalance && mobiBalance && poofBalance && crealBalance) {

            //const total = celoBalance.amount + cusdBalance.amount + ceurBalance.amount + ubeBalance.amount + mooBalance.amount + poofBalance.amount + mobiBalance.amount;
            const currencObj = Object.values(currencies)
            const currencObj2: IBalanceItem[] = Object.values(balanceRedux)

            let indexable = 0;
            const per = currencObj.reduce((a, c: ICurrencyInternal, index) => {
                if (currencObj2[index].amount > 0) {
                    a += c.percent_24
                    indexable++
                }
                return a;
            }, 0)

            const result: number =
                (celoBalance.amount * celoBalance.tokenPrice) + (cusdBalance.amount * cusdBalance.tokenPrice) +
                (ceurBalance.amount * ceurBalance.tokenPrice) + (ubeBalance.amount * ubeBalance.tokenPrice) +
                (mooBalance.amount * mooBalance.tokenPrice) + (mobiBalance.amount * mobiBalance.tokenPrice) +
                (poofBalance.amount * poofBalance.tokenPrice) + (crealBalance.amount * crealBalance.tokenPrice)

            setBalance(result.toFixed(2))
            setPercent(per / indexable)

        }else if(celoBalance === undefined){
            setBalance(undefined)
        }
    }, [celoBalance, cusdBalance, ceurBalance, ubeBalance, mooBalance, mobiBalance, poofBalance])



    useEffect(() => {
        if (all) {
            setAllInOne(Object.values(all).sort((a, b) => (b.amount * b.tokenPrice).toLocaleString().localeCompare((a.amount * a.tokenPrice).toLocaleString())).slice(0, 4))
        }
    }, [all])

    useEffect(() => {
        if (transactions) {
            let myin = 0;
            let myout = 0;
            transactions.result.forEach(t => {
                let feeToken = Object.entries(TransactionFeeTokenName).find(w => w[0] === t.tokenSymbol)?.[1]
                const coin = feeToken ? Coins[feeToken] : Coins.cUSD;
                const tTime = new Date(parseInt(t.timeStamp) * 1e3)
                if (tTime.getMonth() === new Date().getMonth()) {
                    const calc = (parseFloat(Web3.utils.fromWei(t.value, 'ether')) * (feeToken ? (currencies[coin.name]?.price ?? 0) : 0))
                    if (t.from.toLowerCase() === selectedAccount.toLowerCase()) {
                        myout += calc
                    } else {
                        myin += calc
                    }
                }
            })
            setIn(myin)
            setOut(myout)
        }
    }, [transactions])

    return <>
        <div className="col-span-2 flex flex-col">
            <div className="flex justify-between pl-4 h-[30px]">
                <div className="text-base text-greylish">Total Balance</div>
                <div className="text-base text-greylish opacity-70">24h</div>
            </div>
            <div className="flex justify-between shadow-custom rounded-xl px-8 py-8">
                <div className="text-4xl">
                    {balance || (balance !== undefined && parseFloat(balance) === 0) ? `$${balance}` : <ClipLoader />}
                </div>
                <div className="flex items-center text-3xl text-greylish opacity-70" style={
                    balance !== undefined && parseFloat(balance) !== 0 ? percent && percent > 0 ? { color: 'green' } : { color: 'red' } : { color: 'black' }
                }>
                    {balance !== undefined && parseFloat(balance) !== 0 ? percent ? `${percent.toFixed(2)}%` : <ClipLoader /> : '0%'}
                </div>
            </div>
        </div>

        <div>
            <div className="flex justify-between sm:pl-4">
                <div className="text-greylish text-sm sm:text-base">Money in (c.m.)</div>
            </div>
            <div className="flex justify-between shadow-custom rounded-xl px-8 py-4">
                <div className="text-xl sm:text-2xl opacity-80">
                    {lastIn !== undefined && transactions !== undefined && balance !== undefined ? `+ $${lastIn?.toFixed(2)}` : <ClipLoader />}
                </div>
            </div>
        </div>

        <div>
            <div className="flex justify-between sm:pl-4">
                <div className="text-greylish text-sm sm:text-base">Money out (c.m.)</div>
            </div>
            <div className="flex justify-between shadow-custom rounded-xl px-8 py-4">
                <div className="text-greylish opacity-80 text-xl sm:text-2xl">
                    {lastOut !== undefined && transactions !== undefined && balance !== undefined ? `- $${lastOut?.toFixed(2)}` : <ClipLoader />}
                </div>
            </div>
        </div>

        <div className="sm:flex flex-col hidden">
            <div>Asset</div>
            <div>
                {celoBalance !== undefined && cusdBalance !== undefined ? <div className="w-[200px] h-[200px] rounded-full relative" style={{
                    background: chart
                }}>
                    <div className="w-[120px] h-[120px] bg-white left-1/2 top-1/2 absolute -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                </div> : null}
            </div>
        </div>
        {
            balance && allInOne !== undefined ?
                <div className="flex flex-col gap-5 overflow-hidden col-span-2 sm:col-span-1">
                    {allInOne.map((item, index) => {
                        return <CoinItem key={generate()} title={item.coins.name} coin={item.amount.toFixed(2)} usd={((item.tokenPrice ?? 0) * item.amount).toFixed(2)} percent={(item.percent || 0).toFixed(1)} rate={item.per_24} img={item.coins.coinUrl} />
                    })}
                </div> : <ClipLoader />
        }</>

}


export default Statistic;