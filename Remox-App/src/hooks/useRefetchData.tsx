import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLazyGetBalanceQuery, useLazyGetCurrenciesQuery, useLazyGetMultisigBalanceQuery, useLazyGetNotExecutedTransactionsQuery, useLazyGetTransactionsQuery } from '../redux/api'
import { SelectCurrencies, updateAllCurrencies, updateUserBalance } from '../redux/reducers/currencies'
import { SelectSelectedAccount } from '../redux/reducers/selectedAccount'
import { selectStorage } from '../redux/reducers/storage'
import { SelectTransactions, setTransactions } from '../redux/reducers/transactions'
import { Coins } from '../types/coins'
import { GetBalanceResponse, MultisigBalanceResponse } from '../types/sdk'

const useRefetchData = (disableInterval = false) => {
    const dispatch = useDispatch()
    const storage = useSelector(selectStorage)
    const selectedAccount = useSelector(SelectSelectedAccount)
    const transactionStore = useSelector(SelectTransactions)
    const currencies = useSelector(SelectCurrencies)

    const [currencyTrigger, { data: currencyData, isFetching }] = useLazyGetCurrenciesQuery()
    const [balanceTrigger, { data: balanceData, isFetching: balanceFetching }] = useLazyGetBalanceQuery()
    const [transactionTrigger, { data: transactionData, isFetching: transactionFetching }] = useLazyGetTransactionsQuery()

    const [multisigTrigger, { data: multisigBalance, isFetching: multiFetching }] = useLazyGetMultisigBalanceQuery()


    useEffect(() => {
        if (transactionData && transactionData.result.length > 0 && !transactionFetching) {
            if (transactionStore?.result.length !== transactionData.result.length || (transactionStore.result[0].hash !== transactionData.result[0].hash || transactionStore.result[transactionStore.result.length - 1].hash !== transactionData.result[transactionData.result.length - 1].hash)) {
                dispatch(setTransactions(transactionData))
            }
        } else if (transactionData && transactionData.result.length === 0) dispatch(setTransactions(transactionData))
    }, [transactionData, transactionFetching])

    useEffect(() => {
        if (currencyData && currencyData.data && (storage?.accountAddress === selectedAccount && balanceData && !balanceFetching) || (storage?.accountAddress !== selectedAccount && multisigBalance && !multiFetching)) {
            const updatedCurrency = currencyData!.data.map(d => ({
                price: d.price,
                percent_24: d.percent_24
            }))

            let [Celo, Cusd, Ceur, Ube, Moo, Mobi, Poof, cReal] = updatedCurrency;
            // cReal = {
            //     price: 0,
            //     percent_24: 0
            // }
            const celo = Celo
            const cusd = Cusd
            const ceur = Ceur
            const ube = Ube
            const moo = Moo
            const mobi = Mobi
            const poof = Poof
            const creal = cReal



            if (balanceData || multisigBalance) {
                let balance;
                if (storage?.accountAddress === selectedAccount) {
                    balance = balanceData;
                } else balance = multisigBalance

                if (balance && celo && cusd && ceur && ube && moo && mobi && poof && creal) {
                    let pCelo;
                    let pCusd;
                    let pCeur;
                    let pUbe;
                    let pMoo;
                    let pMobi;
                    let pPoof;
                    let pReal;
                    if (storage?.accountAddress === selectedAccount) {
                        balance = balance as GetBalanceResponse;
                        pCelo = parseFloat(balance.celoBalance);
                        pCusd = parseFloat(balance.cUSDBalance);
                        pCeur = parseFloat(balance.cEURBalance);
                        pUbe = parseFloat(balance.UBE);
                        pMoo = parseFloat(balance.MOO);
                        pMobi = parseFloat(balance.MOBI);
                        pPoof = parseFloat(balance.POOF);
                        pReal = parseFloat(balance.cREAL);
                    } else {
                        balance = balance as MultisigBalanceResponse;
                        pCelo = parseFloat(balance.celo);
                        pCusd = parseFloat(balance.cUSD);
                        pCeur = parseFloat(balance.cEUR);
                        pUbe = parseFloat(balance.UBE);
                        pMoo = parseFloat(balance.MOO);
                        pMobi = parseFloat(balance.MOBI);
                        pPoof = parseFloat(balance.POOF);
                        pReal = parseFloat(balance.cREAL);
                    }

                    const celoPrice = pCelo * (celo.price ?? 0);
                    const cusdPrice = pCusd * (cusd.price ?? 0);
                    const ceurPrice = pCeur * (ceur.price ?? 0);
                    const ubePrice = pUbe * (ube.price ?? 0);
                    const mooPrice = pMoo * (moo.price ?? 0);
                    const mobiPrice = pMobi * (mobi.price ?? 0);
                    const poofPrice = pPoof * (poof.price ?? 0);
                    const cRealPrice = pReal * (creal.price ?? 0);

                    const total = celoPrice + cusdPrice + mooPrice + + ceurPrice + ubePrice + mobiPrice + poofPrice + cRealPrice;

                    const updatedBalance = [
                        { amount: pCelo, per_24: Celo.percent_24, percent: (celoPrice * 100) / total, coins: Coins.celo, tokenPrice: +celo.price },
                        { amount: pCusd, per_24: Cusd.percent_24, percent: (cusdPrice * 100) / total, coins: Coins.cUSD, tokenPrice: +cusd.price },
                        { amount: pCeur, per_24: Ceur.percent_24, percent: (ceurPrice * 100) / total, coins: Coins.cEUR, tokenPrice: +ceur.price },
                        { amount: pUbe, per_24: Ube.percent_24, percent: (ubePrice * 100) / total, coins: Coins.UBE, tokenPrice: +ube.price },
                        { amount: pMoo, per_24: Moo.percent_24, percent: (mooPrice * 100) / total, coins: Coins.MOO, tokenPrice: +moo.price },
                        { amount: pMobi, per_24: Mobi.percent_24, percent: (mobiPrice * 100) / total, coins: Coins.MOBI, tokenPrice: +mobi.price },
                        { amount: pPoof, per_24: Poof.percent_24, percent: (poofPrice * 100) / total, coins: Coins.POOF, tokenPrice: +poof.price },
                        { amount: pReal, per_24: cReal.percent_24, percent: (cRealPrice * 100) / total, coins: Coins.cREAL, tokenPrice: +creal.price }
                    ]

                    dispatch(updateUserBalance(updatedBalance))
                }
            }
        }

    }, [balanceData, balanceFetching, multisigBalance, multiFetching])

    useEffect(() => {
        if (currencyData && !isFetching) {
            const updatedCurrency = currencyData.data.map(d => ({
                price: d.price,
                percent_24: d.percent_24
            }))
            
            if (!currencies.CELO || Object.values(currencies).some((w, i) => {
                return w.price !== updatedCurrency[i].price
            })) {
                dispatch(updateAllCurrencies(
                    updatedCurrency
                ))
            }

            if (storage?.accountAddress === selectedAccount) {
                transactionTrigger(storage!.accountAddress)
                balanceTrigger()
            } else {
                transactionTrigger(selectedAccount)
                multisigTrigger({ address: selectedAccount })
            }

        }
    }, [currencyData, isFetching])

    const fetching = () => {
        currencyTrigger()
    }

    useEffect(() => {
        let timer: any;
        if (!disableInterval) {
            timer = setInterval(() => {
                fetching()
            }, 10000)
        }

        return () => { if (timer) clearInterval(timer) }
    })

    return [fetching];
}

export default useRefetchData;