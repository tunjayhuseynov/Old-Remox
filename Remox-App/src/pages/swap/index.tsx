import { Dropdown } from "../../components";
import { Coins } from "../../types/coins";
import { DropDownItem } from '../../types'
import { useCallback, useEffect, useRef, useState } from "react";
import { useGetConvertableTokenAmountMutation, useSwapCoinsMutation } from "../../redux/api";
import { useDispatch, useSelector } from "react-redux";
import { SelectBalances } from "../../redux/reducers/currencies";
import { selectStorage } from "../../redux/reducers/storage";
import { changeError, changeSuccess, selectError, selectSuccess } from "../../redux/reducers/notificationSlice";
import Success from "../../components/success";
import Error from "../../components/error";
import { ClipLoader } from "react-spinners";
import Modal from "../../components/modal";
import { useRefetchData, useModalSideExit } from '../../hooks';
import useMultisig from "../../hooks/useMultisig";
import Button from "../../components/button";

const Swap = () => {
    const [token1, setToken1] = useState<DropDownItem>(Coins.cUSD)
    const [token1Amount, setToken1Amount] = useState<number>()
    const [token2, setToken2] = useState<DropDownItem>(Coins.celo)

    const { isMultisig } = useMultisig()

    const [refetch] = useRefetchData()

    const token1Input = useRef<HTMLInputElement>(null)

    const [appAmount, setAppAmount] = useState<string>("0")
    const [fee, setFee] = useState<string>("")
    const [oneCoinPrice, setOneCoinPrice] = useState<string>("")

    const [isOpen, setOpen] = useState<boolean>(false)
    const [isSetting, setSetting] = useState<boolean>(false)

    const [slippageArr, setSlippageArr] = useState([
        { value: 1, label: '0,1%', selected: false },
        { value: 5, label: '0,5%', selected: true },
        { value: 10, label: '1%', selected: false },
        { value: 0, label: '0%', selected: false, invisible: true }
    ])

    const [deadline, setDeadline] = useState<number>(1.5)

    const balances = useSelector(SelectBalances)
    const storage = useSelector(selectStorage)
    const isSuccess = useSelector(selectSuccess)
    const isError = useSelector(selectError)

    const dispatch = useDispatch()

    const [fetchCoin, { isLoading: coinLoading }] = useGetConvertableTokenAmountMutation()
    const [swap, { isLoading }] = useSwapCoinsMutation()

    const change = async (value?: number) => {
        if (token1.value && token2.value) {
            try {
                const data = await fetchCoin({
                    input: token1.value,
                    output: token2.value,
                    amount: (value || (token1Amount ?? 0)).toString(),
                    slippage: slippageArr.find(item => item.selected)!.value.toString(),
                    deadline: Math.floor(deadline * 60)
                }).unwrap()
                setAppAmount(data.minimumAmountOut)
                setFee(data.feeAmount)
                setOneCoinPrice(data.oneTokenValue)
            } catch (error) {
                console.error(error)
            }

        }
    }

    const startSwap = async () => {
        if (token1.value && token2.value && token1Amount && token1Amount > 0) {
            try {
                const data = await swap({
                    input: token1.value,
                    output: token2.value,
                    amount: token1Amount.toString(),
                    phrase: storage!.encryptedPhrase,
                    slippage: slippageArr.find(item => item.selected)!.value.toString(),
                    deadline: Math.floor(deadline * 60)
                }).unwrap()
                dispatch(changeSuccess({
                    activate: true, text: <div className="flex flex-col items-center">
                        <div className="font-semobold text-xl">Successfully Swapped</div>
                        <div className="text-primary text-sm font-semibold" onClick={() => window.open(`https://explorer.celo.org/tx/${data.hash}/token-transfers`, '_blank')} > View on Celo Explorer</div>
                    </div>
                }))
                setOpen(false)
                refetch()
            } catch (error) {
                console.error(error)
                dispatch(changeError({ activate: true }))
            }

        }
    }

    useEffect(() => {
        if (token1 && token2) {
            change()
        }
    }, [token1, token2, token1Amount])

    const settingRef = useModalSideExit(isSetting, setSetting)


    const changeSwap = () => {
        const token1_copy = { ...token1 }
        const token2_copy = { ...token2 }
        const token2_amount = parseFloat(appAmount)
        setToken1(token2_copy)
        setToken2(token1_copy)

        setToken1Amount(parseFloat(token2_amount.toFixed(2)))
    }

    if (isMultisig) return <div className="text-center py-2">We are working on bringing Swap into MultiSig account. Please, select a wallet account until we finish it</div>

    return <div className="flex items-center justify-center">
        <div className="flex flex-col w-[50%]">
            <div className="shadow-custom rounded-xl bg-white pt-3 pb-10 px-3 flex flex-col space-y-1">
                <div className="flex justify-between">
                    <div className="font-bold font-xl pb-2">Swap</div>
                    <div className="relative">
                        <img src="/icons/settings.svg" className="cursor-pointer" onClick={() => setSetting(!isSetting)} />
                        {isSetting && <div ref={settingRef} className="absolute z-[300] shadow-custom bg-white rounded-xl min-w-[250px] left-0 translate-x-[-90%] bottom-0 translate-y-full p-3 text-sm">
                            <div className="flex flex-col space-y-4">
                                <div className="font-bold">Transaction Settings</div>
                                <div className="flex flex-col space-y-3">
                                    <div>Slippage tolerance</div>
                                    <div className="flex space-x-1 px-2">
                                        {slippageArr.filter(s => !s.invisible).map((item, index) => <div key={index} onClick={() => {
                                            const arr = [...slippageArr]
                                            arr.forEach(i => i.selected = false)
                                            arr[index].selected = true
                                            setSlippageArr(arr)
                                        }} className={`${item.selected ? "bg-primary bg-opacity-100 text-white" : ""} px-2 py-1 bg-greylish bg-opacity-10 cursor-pointer rounded-xl`}>{item.label}</div>)}
                                        <div className="bg-greylish bg-opacity-10 rounded-xl flex items-center pl-3 pr-5 space-x-1">
                                            <input placeholder="0.5" type="number" value={((slippageArr.at(-1)!.value / 10) || undefined)} className="outline-none text-right bg-transparent max-w-[50px] unvisibleArrow" min={0} step={"any"} max={100} onChange={(event) => {
                                                const value = (event.target as HTMLInputElement).value
                                                if (parseFloat(value) >= 0) {
                                                    setSlippageArr(slippageArr.map((item, index) => {
                                                        if (index === slippageArr.length - 1) {
                                                            item.selected = true
                                                            item.value = Math.max(0, Math.min(100, parseFloat(value))) * 10
                                                        } else item.selected = false
                                                        return item
                                                    }))
                                                } else if (!value || value === "0") {
                                                    setSlippageArr(slippageArr.map((item, index) => {
                                                        if (index === slippageArr.length - 1) {
                                                            item.selected = false
                                                            item.value = 0
                                                        } else if (index == 1) { item.selected = true } else item.selected = false
                                                        return item
                                                    }))
                                                }
                                            }} />
                                            <span>%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <div>Transaction deadline</div>
                                    <div className="flex space-x-1 px-2 items-center">
                                        <input type="number" value={deadline === 1.5 ? undefined : deadline} onChange={(event) => {
                                            const value = (event.target as HTMLInputElement).value
                                            if (value) {
                                                setDeadline(parseFloat(value))
                                            } else setDeadline(1.5)
                                        }} className="bg-greylish bg-opacity-10 rounded-xl py-1 w-[100px] outline-none px-2 text-right unvisibleArrow" placeholder="1.5" />
                                        <div>minutes</div>
                                    </div>
                                </div>

                            </div>
                        </div>}
                    </div>
                </div>
                <div className="bg-greylish bg-opacity-10 items-center flex justify-between rounded-md py-3 px-3">
                    <div className="flex flex-col space-y-2 w-[130px]">
                        <div>
                            <Dropdown onChange={(w: DropDownItem, selected: DropDownItem) => {
                                if (w.value === token2.value) {
                                    setToken2(selected)
                                }
                            }} parentClass="shadow-custom bg-white rounded-md" onSelect={setToken1} className="border-none py-1 space-x-4 text-sm" nameActivation={true} selected={token1} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, value: w.value, coinUrl: w.coinUrl, feeName: w.feeName, id: w.value, className: "text-sm" }))} />
                        </div>
                        <div>
                            <input ref={token1Input} value={token1Amount} onChange={async (e) => { setToken1Amount(parseFloat((e.target.value))); await change(parseFloat((e.target.value))); }} type="number" className="bg-transparent text-center outline-none unvisibleArrow max-w-[130px]" placeholder="0" min="0" step="any" />
                        </div>
                    </div>
                    <div className="flex flex-col space-y-2 items-end">
                        <div>
                            Balance: {token1 && token1.name && balances[token1.name as keyof typeof balances] ? (balances[token1.name as keyof typeof balances]?.amount.toFixed(2) ?? 0) : 0}
                        </div>
                        <div className="flex space-x-2">
                            <button className="shadow-custom bg-white px-2 py-1 rounded-xl text-xs" onClick={
                                () => {
                                    if (balances && token1 && balances[token1.name as keyof typeof balances] && balances[token1.name as keyof typeof balances]!.amount > 0) {
                                        const amount = balances[token1.name as keyof typeof balances]!.amount * 0.5
                                        token1Input.current!.value = amount.toFixed(2)
                                        setToken1Amount(amount)
                                    }
                                }
                            }>
                                50%
                            </button>
                            <button className="shadow-custom bg-white px-2 py-1 rounded-xl text-xs" onClick={() => {
                                if (balances && token1 && balances[token1.name as keyof typeof balances] && balances[token1.name as keyof typeof balances]!.amount > 0) {
                                    const amount = balances[token1.name as keyof typeof balances]!.amount
                                    token1Input.current!.value = amount.toFixed(2)
                                    setToken1Amount(amount)
                                }
                            }}>
                                MAX
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <div className="bg-greylish bg-opacity-10 px-3 py-1 rounded-lg cursor-pointer" onClick={changeSwap}>
                        <img src="/icons/arrowdown.svg" alt="" />
                    </div>
                </div>
                <div className="flex bg-greylish bg-opacity-10 justify-between rounded-md py-3 px-3">
                    <div className="flex flex-col space-y-2 w-[130px]">
                        <div>
                            <Dropdown onChange={(w: DropDownItem, selected: DropDownItem) => {
                                if (w.value === token1.value) {
                                    setToken1(selected)
                                }
                            }} parentClass="shadow-custom bg-white rounded-md" onSelect={setToken2} className="border-none py-1 space-x-4 text-sm" nameActivation={true} selected={token2} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, value: w.value, feeName: w.feeName, coinUrl: w.coinUrl, id: w.value, className: "text-sm" }))} />
                        </div>
                        <div>
                            {!(!token1Amount) && (!coinLoading ?
                                <>
                                    <div className="text-center outline-none unvisibleArrow">
                                        {parseFloat(appAmount).toFixed(2)}
                                    </div>
                                </> : <div className="text-center"><ClipLoader size="24px" /></div>)
                            }
                        </div>
                    </div>
                    <div className="flex flex-col items-end h-full">
                        <div className="text-right outline-none unvisibleArrow">
                            Balance: {token2 && token2.name && balances[token2.name as keyof typeof balances] ? (balances[token2.name as keyof typeof balances]?.amount.toFixed(2) ?? 0) : 0}

                        </div>
                    </div>
                </div>
            </div>
            <div className="px-8 py-3 font-extralight text-sm">
                <div className="flex justify-between">
                    <div>Rate:</div>
                    <div className="flex">1 {token1.name} = {!coinLoading ? parseFloat(oneCoinPrice).toFixed(2) : <div className="px-3"><ClipLoader size={18} /></div>} {token2.name}</div>
                </div>
                <div className="flex justify-between">
                    <div>Fee:</div>
                    <div className="flex">{!coinLoading ? fee : <div className="px-3"><ClipLoader size={18} /> </div>} {token1.name}</div>
                </div>
            </div>
            <div className="text-center mx-8">
                <Button className="w-full" onClick={() => setOpen(true)} isLoading={isLoading}>
                    Swap
                </Button>
            </div>
        </div>
        {isOpen && <Modal onDisable={setOpen} title="Confirm Swap" className="lg:left-[55.5%]">
            <div className="flex flex-col -mx-5 space-y-5">
                <div className="flex flex-col py-2 pb-10 space-y-7 border-b-2 px-5">
                    <div className="grid grid-cols-[7%,73%,20%] items-center">
                        <div>
                            <img src={`${token1.coinUrl}`} alt="" className="w-[20px[ h-[20px]" />
                        </div>
                        <div className="font-bold">
                            {token1Amount}
                        </div>
                        <div className="text-right">
                            {token1.name}
                        </div>
                    </div>
                    <div className="grid grid-cols-[7%,73%,20%] items-center">
                        <div>
                            <img src={`/icons/longdown.svg`} alt="" />
                        </div>
                    </div>
                    <div className="grid grid-cols-[7%,73%,20%] items-center">
                        <div>
                            <img src={`${token2.coinUrl}`} className="w-[20px[ h-[20px]" alt="" />
                        </div>
                        <div className="font-bold">
                            {parseFloat(appAmount).toFixed(2)}
                        </div>
                        <div className="text-right">
                            {token2.name}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col px-5 text-xs space-y-1">
                    <div className="flex justify-between">
                        <div>Rate:</div>
                        <div className="flex">1 {token1.name} = {!coinLoading ? parseFloat(oneCoinPrice).toFixed(2) : <div className="px-3"><ClipLoader size={18} /></div>} {token2.name}</div>
                    </div>
                    <div className="flex justify-between">
                        <div>Fee:</div>
                        <div className="flex">{!coinLoading ? fee : <div className="px-3"><ClipLoader size={18} /> </div>} {token1.name}</div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Button className="w-3/5" onClick={startSwap} isLoading={isLoading}>Confirm Swap</Button>
                </div>
            </div>
        </Modal>}
        {isSuccess && <Success onClose={(val: boolean) => dispatch(changeSuccess({ activate: val }))} />}
        {isError && <Error onClose={(val: boolean) => dispatch(changeError({ activate: val }))} />}
    </div>
}

export default Swap;