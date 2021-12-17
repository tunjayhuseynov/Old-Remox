import { Dropdown } from "../../components";
import { Coins, CoinsNameVisual } from "../../types/coins";
import { DropDownItem } from '../../types'
import { useRef, useState } from "react";
import { useGetConvertableTokenAmountMutation, useSwapCoinsMutation } from "../../redux/api";
import { useDispatch, useSelector } from "react-redux";
import { SelectCurrencies } from "../../redux/reducers/currencies";
import { selectStorage } from "../../redux/reducers/storage";
import { changeError, changeSuccess, selectError, selectSuccess } from "../../redux/reducers/notificationSlice";
import Success from "../../components/success";
import Error from "../../components/error";
import { ClipLoader } from "react-spinners";

const Swap = () => {
    const [token1, setToken1] = useState<DropDownItem>(Coins.cUSD)
    const [token2, setToken2] = useState<DropDownItem>(Coins.celo)
    
    const token1Input = useRef<HTMLInputElement>(null)
    const [appAmount, setAppAmount] = useState<string>("0")
    
    const currencies = useSelector(SelectCurrencies)
    const storage = useSelector(selectStorage)
    const isSuccess = useSelector(selectSuccess)
    const isError = useSelector(selectError)

    const dispatch = useDispatch()

    const [fetchCoin] = useGetConvertableTokenAmountMutation()
    const [swap, { isLoading }] = useSwapCoinsMutation()

    const change = async () => {
        console.log(token1.value, token2.value, token1Input.current?.value)
        if (token1.value && token2.value && token1Input.current && parseFloat(token1Input.current.value) > 0) {
            try {
                const data = await fetchCoin({
                    input: token1.value,
                    output: token2.value,
                    amount: token1Input.current.value
                }).unwrap()
                setAppAmount(data.minimumAmountOut)
            } catch (error) {
                console.error(error)
            }

        }
    }

    const startSwap = async () => {
        try {
            if (token1.value && token2.value && token1Input.current && parseFloat(token1Input.current.value) > 0) {
                try {
                    const data = await swap({
                        input: token1.value,
                        output: token2.value,
                        amount: token1Input.current.value, 
                        phrase: storage!.encryptedPhrase
                    }).unwrap()
                    dispatch(changeSuccess(true))
                } catch (error) {
                    console.error(error)
                    dispatch(changeError({activate: true}))
                }

            }
        } catch (error) {

        }
    }

    return <div className="flex items-center justify-center">
        <div className="flex flex-col w-[50%]">
            <div className="font-bold pl-3 font-xl pb-2">Swap</div>
            <div className="shadow-custom rounded-xl bg-white py-10 px-3 flex flex-col space-y-1">
                <div className="bg-greylish bg-opacity-10 items-center flex justify-between rounded-md py-3 px-3">
                    <div>
                        <Dropdown parentClass="shadow-custom bg-white rounded-xl" onSelect={setToken1} className="border-none py-1 space-x-4 text-sm" nameActivation={true} selected={token1} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, value: w.value, coinUrl: w.coinUrl, feeName: w.feeName, id: w.value, className: "text-sm" }))} />
                    </div>
                    <div className="flex flex-col space-y-1 items-end">
                        <div>
                            <input onChange={change} ref={token1Input} type="number" className="bg-transparent text-right outline-none unvisibleArrow" placeholder="0" min="0" step="any" />
                        </div>
                        <div className="text-xs font-extralight">
                            ~$ {(parseFloat(token1Input?.current?.value ?? "0") * (currencies[(token1.name) as CoinsNameVisual]?.price ?? 0)).toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <div className="bg-greylish bg-opacity-10 px-3 py-1 rounded-lg">
                        <img src="/icons/arrowdown.svg" alt="" />
                    </div>
                </div>
                <div className="flex bg-greylish bg-opacity-10 items-center justify-between rounded-md py-3 px-3">
                    <div>
                        <Dropdown parentClass="shadow-custom bg-white rounded-xl" onSelect={setToken2} className="border-none py-1 space-x-4 text-sm" nameActivation={true} selected={token2} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, value: w.value, feeName: w.feeName, coinUrl: w.coinUrl, id: w.value, className: "text-sm" }))} />
                    </div>
                    <div className="flex flex-col space-y-1 items-end">
                        <div className="text-right outline-none unvisibleArrow">
                            {parseFloat(appAmount).toFixed(2)}
                        </div>
                        <div className="text-xs font-extralight">
                            ~$ {(parseFloat(appAmount) * (currencies[(token2.name ?? CoinsNameVisual.CELO) as CoinsNameVisual]?.price ?? 0)).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-8 py-3 font-extralight text-sm">
                <div className="flex justify-between">
                    <div>Rate:</div>
                    <div>1 {token1.name} = {(parseFloat(appAmount||"1") / parseFloat(token1Input?.current?.value ?? "0")).toFixed(2)} {token2.name}</div>
                </div>
                {/* <div className="flex justify-between">
                    <div>Fee:</div>
                    <div>0.001 Celo</div>
                </div> */}
            </div>
            <div className="text-center mx-8">
                <button className="bg-primary w-full py-3 text-white rounded-xl" onClick={startSwap}>
                    {isLoading? <ClipLoader/> : "Swap"}
                </button>
            </div>
        </div>
        {isSuccess && <Success onClose={(val: boolean) => dispatch(changeSuccess(val))} text="Successfully" />}
        {isError && <Error onClose={(val: boolean) => dispatch(changeError({activate: val}))} />}
    </div>
}

export default Swap;