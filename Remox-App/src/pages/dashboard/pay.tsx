import { useState, useRef, useEffect, SyntheticEvent } from "react";
import Dropdown from "../../components/dropdown";
import { generate } from 'shortid'
import { useNavigate } from 'react-router-dom'
import ClipLoader from "react-spinners/ClipLoader";
import Success from "../../components/success";
import Error from "../../components/error";
import { DropDownItem } from "../../types/dropdown";
import { MultipleTransactionData } from "../../types/sdk";
import CSV from '../../utility/CSV'
import { useGetBalanceQuery, useSendCeloMutation, useSendStableTokenMutation, useSendMultipleTransactionsMutation, useSendAltTokenMutation, useSubmitTransactionsMutation, useGetConvertableTokenAmountMutation } from "../../redux/api";
import { useSelector } from "react-redux";
import { selectStorage } from "../../redux/reducers/storage";
import Input from "../../components/pay/payinput";
import { AltCoins, AltcoinsList, Coins, CoinsNameVisual, StableTokens, TransactionFeeTokenName } from "../../types/coins";
import { useAppDispatch } from "../../redux/hooks";
import { changeError, selectError } from "../../redux/reducers/notificationSlice";
import { SelectSelectedAccount } from "../../redux/reducers/selectedAccount";
import { IBalanceItem, SelectBalances } from "../../redux/reducers/currencies";
import { useRefetchData } from "../../hooks";
import Button from "../../components/button";


const Pay = () => {

    const storage = useSelector(selectStorage)
    const selectedAccount = useSelector(SelectSelectedAccount)
    const isError = useSelector(selectError)
    const dispatch = useAppDispatch()
    const router = useNavigate();

    //const [tokenAmount] = useGetConvertableTokenAmountMutation()

    const balance = useSelector(SelectBalances)

    const [fetching] = useRefetchData(true)

    // const { data, refetch } = useGetBalanceQuery()


    const [sendCelo] = useSendCeloMutation()
    const [sendStableToken] = useSendStableTokenMutation()
    const [sendMultiple] = useSendMultipleTransactionsMutation()
    const [sendAltcoin] = useSendAltTokenMutation()

    const [sendMultisig] = useSubmitTransactionsMutation()


    const [index, setIndex] = useState(1)
    const [isPaying, setIsPaying] = useState(false)
    const [isSuccess, setSuccess] = useState(false)

    const [selectedType, setSelectedType] = useState(false)


    const [amountState, setAmountState] = useState<number[]>([])
    const uniqueRef = useRef<string[]>([generate(), generate()])
    const nameRef = useRef<Array<string>>([])
    const addressRef = useRef<Array<string>>([])
    const [wallets, setWallets] = useState<DropDownItem[]>([])
    const amountRef = useRef<Array<string>>([])

    const [refreshPage, setRefreshPage] = useState<string>("")

    const [csvImport, setCsvImport] = useState<string[][]>([]);

    const fileInput = useRef<HTMLInputElement>(null);

    const [selectedWallet, setSelectedWallet] = useState<DropDownItem>();
    const [list, setList] = useState<Array<DropDownItem>>([]);

    const reset = () => {
        nameRef.current = []
        addressRef.current = []
        amountRef.current = []
        uniqueRef.current = []
        //setAmountState([])
        //setWallets([]);
    }

    useEffect(() => {
        fetching()
    }, [])


    useEffect(() => {
        if (csvImport.length > 0) {
            const list = csvImport.filter(w => w[1] && w[2] && w[3] && w[4] && w[5])
            reset()
            let ind = 0;
            const wllt: any[] = []
            const amm: number[] = []
            for (let index = 0; index < list.length; index++) {
                const [name, address, amount, coin, amount2, coin2] = list[index].slice(0, 6)

                uniqueRef.current.push(generate())
                uniqueRef.current.push(generate())
                nameRef.current.push((name || ""));
                addressRef.current.push((address || ""));
                amountRef.current.push((amount || ""));
                amm.push(parseFloat(amount || "0"))
                nameRef.current.push((name || ""));
                addressRef.current.push((address || ""));
                amountRef.current.push((amount2 || ""));
                amm.push(parseFloat(amount2 || "0"))

                const a = { ...Coins[coin as TransactionFeeTokenName], type: Coins[coin as TransactionFeeTokenName].value };
                const b = { ...Coins[coin2 as TransactionFeeTokenName], type: Coins[coin2 as TransactionFeeTokenName].value };
                const wallet = [a, b];
                wllt.push(...wallet)
                setAmountState(amm)

            }
            setIndex((index === 1 ? 0 : index) + list.length)
            setWallets(wllt)
            // setRefreshPage(generate())
            fileInput.current!.files = new DataTransfer().files;
        }
    }, [csvImport])


    useEffect(() => {
        if (balance && balance.CELO) {
            const coins = Object.values(balance).map((coin: IBalanceItem) => ({
                name: `${coin.amount.toFixed(3)} ${coin.coins.name}`,
                type: coin.coins.value.toString(),
                amount: coin.amount.toString(),
                coinUrl: coin.coins.coinUrl,
            }))
            const v = { name: coins[0].name.split(' ')[1], coinUrl: coins[0].coinUrl, type: coins[0].type }
            setWallets([{ ...v }, { ...v }])
            setSelectedWallet(coins[0])
            setList(coins)
        }
    }, [balance])

    const Submit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPaying(true)

        try {
            const result: Array<MultipleTransactionData> = []

            const [nameList, addressList, amountList] = [nameRef.current, addressRef.current, amountRef.current]


            for (let index = 0; index < addressList.length; index++) {
                if (addressList[index] && amountList[index] && wallets[index].type) {
                    let amount = amountList[index];
                    if (selectedType) {
                        let value = (balance[wallets[index].name as keyof typeof balance]?.tokenPrice ?? 1)
                        amount = (parseFloat(amount) / value).toFixed(4)
                    }
                    result.push({
                        toAddress: addressList[index],
                        amount: amount,
                        tokenType: wallets[index].type!,
                    })
                }
            }

            if (storage!.accountAddress.toLowerCase() === selectedAccount.toLowerCase()) {
                if (result.length === 1 && selectedWallet && selectedWallet.name) {
                    if (result[0]!.tokenType === Coins.celo.value) {
                        await sendCelo({
                            toAddress: result[0].toAddress,
                            amount: result[0].amount,
                            comment: "",
                            phrase: storage!.encryptedPhrase
                        }).unwrap()

                    } else if (result[0]!.tokenType === CoinsNameVisual.cUSD || result[0]!.tokenType === CoinsNameVisual.cEUR) {
                        await sendStableToken({
                            toAddress: result[0].toAddress,
                            amount: result[0].amount,
                            phrase: storage!.encryptedPhrase,
                            stableTokenType: result[0].tokenType === CoinsNameVisual.cUSD ? 'cUSD' as StableTokens : 'cEUR' as StableTokens
                        }).unwrap()
                    } else {
                        await sendAltcoin({
                            toAddress: result[0].toAddress,
                            amount: result[0].amount,
                            phrase: storage!.encryptedPhrase,
                            altTokenType: AltcoinsList[(result[0].tokenType as AltcoinsList)]
                        }).unwrap()
                    }
                }
                else if (result.length > 1) {
                    const arr: Array<MultipleTransactionData> = result.map(w => ({
                        toAddress: w.toAddress,
                        amount: w.amount,
                        tokenType: w.tokenType
                    }))

                    await sendMultiple({
                        multipleAddresses: arr,
                        phrase: storage!.encryptedPhrase
                    }).unwrap()
                }
            } else {
                if (result.length === 1 && selectedWallet && selectedWallet.name) {
                    await sendMultisig({
                        toAddress: result[0].toAddress,
                        multisigAddress: selectedAccount,
                        phrase: storage!.encryptedPhrase,
                        tokenType: result[0].tokenType,
                        value: result[0].amount,
                    }).unwrap()

                }
                else if (result.length > 1) {
                    const arr: Array<MultipleTransactionData> = result.map(w => ({
                        toAddress: w.toAddress,
                        amount: w.amount,
                        tokenType: w.tokenType
                    }))

                    for (let i = 0; i < arr.length; i++) {
                        await sendMultisig({
                            toAddress: arr[i].toAddress,
                            multisigAddress: selectedAccount,
                            phrase: storage!.encryptedPhrase,
                            tokenType: arr[i].tokenType,
                            value: arr[i].amount,
                        }).unwrap()
                    }
                }
            }
            setSuccess(true);
            //refetch()
            fetching()

        } catch (error: any) {
            console.error(error)
            dispatch(changeError({ activate: true, text: error?.data?.message.slice(0, 80) }));
        }

        setIsPaying(false);
    }

    return <div className="sm:px-32">
        <form onSubmit={Submit}>
            <div className="sm:flex flex-col items-center justify-center min-h-screen">
                <div className="sm:min-w-[85vw] min-h-[75vh] h-auto ">
                    <div className="pl-14 py-2 text-left w-full">
                        <div className="text-xl font-semibold">Pay Someone</div>
                    </div>
                    <div className="shadow-xl border sm:flex flex-col gap-3 gap-y-10 sm:gap-10 py-10">
                        <div className="sm:flex flex-col pl-3 sm:pl-12 sm:pr-[20%] gap-3 gap-y-10  sm:gap-10">
                            <div className="flex flex-col space-y-5">
                                <span className="text-left text-sm font-semibold">Payment Type</span>
                                <div className="flex space-x-24">
                                    <div className="flex space-x-2 items-center">
                                        <input type="radio" className="w-4 h-4 accent-[#ff501a] cursor-pointer" name="paymentType" value="token" onChange={(e) => setSelectedType(false)} checked={!selectedType} />
                                        <label className="font-semibold text-sm">
                                            Pay with Token Amounts
                                        </label>
                                    </div>
                                    <div className="flex space-x-2 items-center">
                                        <input type="radio" className="w-4 h-4 accent-[#ff501a] cursor-pointer" name="paymentType" value="fiat" onChange={(e) => setSelectedType(true)} checked={selectedType} />
                                        <label className="font-semibold text-sm">
                                            Pay with USD-based Amounts
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex space-x-5 sm:space-x-0 sm:justify-between py-4 items-center">
                                    <span className="text-left font-semibold text-sm">Paying To</span>

                                    <input ref={fileInput} type="file" className="hidden" onChange={(e) => e.target.files!.length > 0 ? CSV.Import(e.target.files![0]).then(e => setCsvImport(e)).catch(e => console.error(e)) : null} />
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-[25%,35%,35%,5%] gap-5">
                                    {wallets.length > 0 && index ? Array(index).fill(" ").map((e, i) => {
                                        if (!uniqueRef.current[i * 2]) {
                                            uniqueRef.current[i * 2] = generate()
                                            uniqueRef.current[i * 2 + 1] = generate()
                                        }

                                        return <Input key={uniqueRef.current[i * 2]} amountState={amountState} setAmount={setAmountState} setIndex={setIndex} overallIndex={index} uniqueArr={uniqueRef.current} index={i * 2} name={nameRef.current} address={addressRef.current} amount={amountRef.current} selectedWallet={wallets} setWallet={setWallets} setRefreshPage={setRefreshPage} isBasedOnDollar={selectedType} />
                                    }) : <div><ClipLoader /></div>}
                                </div>
                            </div>
                            <div className="py-5 sm:py-0 grid grid-cols-[65%,35%] gap-16">
                                <div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3">
                                    <Button version="second" className="min-w-[200px]" onClick={() => {
                                        setIndex(index + 1)
                                    }}>
                                        + Add More
                                    </Button>
                                    <Button version="second" onClick={() => {
                                        fileInput.current?.click()
                                    }} className="min-w-[200px]">
                                        Import CSV
                                    </Button>
                                </div>
                                <span className="self-center text-lg opacity-60">Total: ${amountState.reduce((a, e, i) => {
                                    if (!wallets[i].type) return a;
                                    if (selectedType) return a + e;
                                    return a + e * (balance[wallets[i].name as keyof typeof balance]?.tokenPrice ?? 1);
                                }, 0).toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-left">Description (Optional)</span>
                                <div className="grid grid-cols-1">
                                    <textarea className="border-2 rounded-xl p-1 outline-none" name="description" id="" cols={30} rows={5}></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center pt-5 sm:pt-0">
                            <div className="flex flex-col-reverse sm:grid grid-cols-2 w-[200px] sm:w-[400px] justify-center gap-5">
                                <Button version="second" onClick={() => router(-1)}>Close</Button>
                                <Button type="submit" className="bg-primary px-3 py-2 text-white flex items-center justify-center rounded-lg" isLoading={isPaying}>Pay</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
        {isSuccess && <Success onClose={setSuccess} onAction={() => { router(-1) }} />}
        {isError && <Error onClose={(val) => dispatch(changeError({ activate: val, text: '' }))} />}
    </div>
}



export default Pay;