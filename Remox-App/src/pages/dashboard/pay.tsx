import { useState, useRef, useEffect, SyntheticEvent } from "react";
import Dropdown from "../../components/dropdown";
import { generate } from 'shortid'
import { useHistory } from 'react-router-dom'
import ClipLoader from "react-spinners/ClipLoader";
import Success from "../../components/success";
import Error from "../../components/error";
import { DropDownItem } from "../../types/dropdown";
import { MultipleTransactionData } from "../../types/sdk";
import CSV from '../../utility/CSV'
import { useGetBalanceQuery, useSendCeloMutation, useSendStableTokenMutation, useSendMultipleTransactionsMutation, useSendAltTokenMutation, useSubmitTransactionsMutation } from "../../redux/api";
import { useSelector } from "react-redux";
import { selectStorage } from "../../redux/reducers/storage";
import Input from "../../components/pay/payinput";
import { AltCoins, AltcoinsList, Coins, CoinsNameVisual, StableTokens, TransactionFeeTokenName } from "../../types/coins";
import { useAppDispatch } from "../../redux/hooks";
import { changeError, selectError } from "../../redux/reducers/notificationSlice";
import { SelectSelectedAccount } from "../../redux/reducers/selectedAccount";
import { IBalanceItem, SelectBalances } from "../../redux/reducers/currencies";
import { useRefetchData } from "../../hooks";


const Pay = () => {

    const storage = useSelector(selectStorage)
    const selectedAccount = useSelector(SelectSelectedAccount)
    const isError = useSelector(selectError)
    const dispatch = useAppDispatch()
    const router = useHistory();

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
        //setWallets([]);
    }

    useEffect(()=>{
        fetching()
    },[])

    useEffect(() => {
        if (selectedWallet && selectedWallet.coinUrl && selectedWallet.type) {
            const val: DropDownItem[] = [];
            for (let index = 0; index < wallets.length; index++) {
                val.push({ name: selectedWallet.name.split(' ')[1], coinUrl: selectedWallet.coinUrl, type: selectedWallet.type })
            }
            setWallets(val);
        }
    }, [selectedWallet])

    useEffect(() => {
        if (csvImport.length > 0) {
            const list = csvImport.filter(w => w[1] && w[2] && w[3] && w[4] && w[5])
            reset()
            let ind = 0;
            const wllt: any[] = []
            for (let index = 0; index < list.length; index++) {
                const [name, address, amount, coin, amount2, coin2] = list[index].slice(0, 6)

                nameRef.current.push((name || ""));
                addressRef.current.push((address || ""));
                amountRef.current.push((amount || ""));
                nameRef.current.push((name || ""));
                addressRef.current.push((address || ""));
                amountRef.current.push((amount2 || ""));

                const a = { ...Coins[coin as TransactionFeeTokenName], type: Coins[coin as TransactionFeeTokenName].value };
                const b = { ...Coins[coin2 as TransactionFeeTokenName], type: Coins[coin2 as TransactionFeeTokenName].value };
                const wallet = [a, b];
                wllt.push(...wallet)

            }
            setIndex((index === 1 ? 0 : index) + list.length)
            console.log(wllt)
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
                    result.push({
                        toAddress: addressList[index],
                        amount: amountList[index],
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
                    <div className="text-left w-full">
                        <div>Pay Someone</div>
                    </div>
                    <div className="shadow-xl border sm:flex flex-col gap-3 gap-y-10 sm:gap-10 py-10">
                        <div className="sm:flex flex-col pl-3 sm:pl-12 sm:pr-[25%] gap-3 gap-y-10  sm:gap-10">
                            <div className="flex flex-col">
                                <span className="text-left">Paying From</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4">
                                    {!(balance && balance.CELO && selectedWallet) ? <ClipLoader /> : <Dropdown onSelect={setSelectedWallet} nameActivation={true} selected={selectedWallet} list={list} disableAddressDisplay={true} />}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex space-x-5 sm:space-x-0 sm:justify-between py-4 items-center">
                                    <span className="text-left">Paying To</span>
                                    <button type="button" onClick={() => {
                                        fileInput.current?.click()
                                    }} className="px-2 py-1 shadow-lg border border-primary text-primary rounded-xl text-sm font-light hover:text-white hover:bg-primary">
                                        + Import CSV
                                    </button>
                                    <input ref={fileInput} type="file" className="hidden" onChange={(e) => e.target.files!.length > 0 ? CSV.Import(e.target.files![0]).then(e => setCsvImport(e)).catch(e => console.error(e)) : null} />
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-[25%,45%,25%,5%] gap-5">
                                    {wallets.length > 0 && Array(index).fill(" ").map((e, i) => <Input key={generate()} setIndex={setIndex} overallIndex={index} index={i * 2} name={nameRef.current} address={addressRef.current} amount={amountRef.current} selectedWallet={wallets} setWallet={setWallets} setRefreshPage={setRefreshPage} />)}
                                </div>
                            </div>
                            <div className="flex flex-col py-5 sm:py-0">
                                <div className="grid grid-cols-2 sm:grid-cols-4">
                                    <button type="button" className="px-3 py-1 sm:px-6 sm:py-3 min-w-[200px] border-2 border-primary text-primary rounded-xl" onClick={() => {
                                        setIndex(index + 1)
                                        // setRefreshPage(generate())
                                    }}>
                                        + Add More
                                    </button>
                                </div>
                            </div>
                            {/* <div className="hidden">{refreshPage}</div> */}
                            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 px-1 sm:px-5">
                                <div className="sm:text-xs font-semibold text-sm opacity-60">Current Balance</div>
                                <div className="sm:text-xs font-semibold text-sm opacity-60">Current Amount To Send</div>
                                <div className="sm:text-xs hidden sm:block font-semibold text-sm opacity-60">Entered Addresses</div>
                                <div className="sm:text-xs hidden sm:block font-semibold text-sm opacity-60">Balance After Transaction</div>
                                { {addressRef.current.length === 0 && <div className="col-span-2 sm:col-span-4 text-center pt-5">No Address Yet</div>} }
                                {balance && balance.CELO && wallets &&
                                    <>
                                        <div className={'flex flex-col space-y-5'}>
                                            {
                                                Object.values(balance).filter((e: IBalanceItem) => wallets.some(s => s.name == e.coins.name)).map((w: IBalanceItem) => {
                                                    return <div key={generate()} className="flex flex-col space-y-3">
                                                        <div>
                                                            {w.amount.toFixed(2)} {w.coins.name}
                                                        </div>
                                                        <div className="text-black opacity-50">
                                                            {(w.amount * w.reduxValue).toFixed(2)} USD
                                                        </div>
                                                    </div>
                                                })
                                            }
                                        </div>
                                        <div className="flex flex-col space-y-5">
                                            {
                                                Object.values(balance).filter((e: IBalanceItem) => wallets.some(s => s.name == e.coins.name)).map((w: IBalanceItem) => {
                                                    const choosenWallets = wallets.map((q, i) => ({ name: q.name, index: i })).filter(d => d.name == w.coins.name)
                                                    let total = 0;
                                                    choosenWallets.forEach(s => {
                                                        const csr = parseFloat(amountRef.current[s.index])
                                                        if (!isNaN(csr)) {
                                                            total += csr;
                                                        }
                                                    })
                                                    return <div key={generate()} className="flex flex-col space-y-3">
                                                        <div>
                                                            {total.toFixed(2)} {w.coins.name}
                                                        </div>
                                                        <div className="text-black opacity-50">
                                                            {(total * w.reduxValue).toFixed(2)} USD
                                                        </div>
                                                    </div>
                                                })
                                            }
                                        </div>
                                        <div className="sm:hidden font-semibold text-sm opacity-60">Entered Adresses</div>
                                        <div className="sm:hidden font-semibold text-sm opacity-60">Balance After Transaction</div>
                                        <div className="text-black opacity-50 text-sm">
                                            {Math.round(addressRef.current.filter(e => e).length / 2)} addresses
                                        </div>
                                        <div className={'flex flex-col space-y-5'}>
                                            {
                                                Object.values(balance).filter((e: IBalanceItem) => wallets.some(s => s.name == e.coins.name)).map((w: IBalanceItem) => {
                                                    const choosenWallets = wallets.map((q, i) => ({ name: q.name, index: i })).filter(d => d.name == w.coins.name)
                                                    let total = 0;
                                                    choosenWallets.forEach(s => {
                                                        const csr = parseFloat(amountRef.current[s.index])
                                                        if (!isNaN(csr)) {
                                                            total += csr;
                                                        }
                                                    })
                                                    return <div key={generate()} className="flex flex-col space-y-3">
                                                        <div>
                                                            {(w.amount - total).toFixed(2)} {w.coins.name}
                                                        </div>
                                                        <div className="text-black opacity-50">
                                                            {((w.amount - total) * w.reduxValue).toFixed(2)} USD
                                                        </div>
                                                    </div>
                                                })
                                            }
                                        </div>
                                    </>
                                }
                            </div> */}
                            <div className="flex flex-col">
                                <span className="text-left">Description (Optional)</span>
                                <div className="grid grid-cols-1">
                                    <textarea className="border-2 rounded-xl p-1 outline-none" name="description" id="" cols={30} rows={5}></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center pt-5 sm:pt-0">
                            <div className="flex flex-col-reverse sm:grid grid-cols-2 w-[200px] sm:w-[400px] justify-center gap-5">
                                <button type="button" className="border-2 border-primary px-3 py-2 text-primary rounded-lg" onClick={() => router.goBack()}>Close</button>
                                <button type="submit" className="bg-primary px-3 py-2 text-white flex items-center justify-center rounded-lg">{isPaying ? <ClipLoader /> : 'Pay'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
        {isSuccess && <Success onClose={setSuccess} onAction={()=>{router.goBack()}}/>}
        {isError && <Error onClose={(val) => dispatch(changeError({ activate: val, text: '' }))} />}
    </div>
}



export default Pay;