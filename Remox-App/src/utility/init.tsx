import { useDispatch } from "react-redux";
import { CoinFullInfo, CoinGeckoClient, CoinMarketChartResponse } from 'coingecko-api-v3';
import { SelectCurrencies, updateAllCurrencies, updateUserBalance } from "../redux/reducers/currencies";
import { useEffect } from "react";
import { transactionAPI, useGetBalanceQuery, useGetCurrenciesQuery } from "../redux/api";
import { useAppSelector } from "../redux/hooks";
import { Coins } from "../types/coins";
import store from '../redux/store'

const Initalization = () => {


    // store.dispatch(updateAllCurrencies([]))
    // store.dispatch(updateUserBalance([]))

    store.dispatch(
        transactionAPI.endpoints.getCurrencies.initiate()
    ).then((res) => {
        store.dispatch(updateAllCurrencies(
            res.data?.data.map(d => ({
                price: d.price,
                percent_24: d.percent_24
            }))
        ))

        const currencies = store.getState().currencies.coins
        console.log(currencies)
        const celo = currencies.CELO
        const cusd = currencies.cUSD
        const ceur = currencies.cEUR
        const ube = currencies.UBE
        const moo = currencies.MOO
        const mobi = currencies.MOBI
        const poof = currencies.POOF

        store.dispatch(
            transactionAPI.endpoints.getBalance.initiate()
        ).then((balanceResponse) => {
            const balance = balanceResponse.data;
            if(balance && celo && cusd && ceur && ube && moo && mobi && poof && store.getState().currencies.coins.CELO) {
                const pCelo = parseFloat(balance.celoBalance);
                const pCusd = parseFloat(balance.cUSDBalance);
                const pCeur = parseFloat(balance.cEURBalance);
                const pUbe = parseFloat(balance.UBE);
                const pMoo = parseFloat(balance.MOO);
                const pMobi = parseFloat(balance.MOBI);
                const pPoof = parseFloat(balance.POOF);
                const total = pCelo + pCusd + pCeur + pUbe + pMoo + pMobi + pPoof;

                store.dispatch(updateUserBalance([
                    { amount: pCelo, per_24: currencies.CELO?.percent_24, percent: (pCelo * 100) / total, coins: Coins.celo, reduxValue: celo.price },
                    { amount: pCusd, per_24: currencies.cUSD?.percent_24, percent: (pCusd * 100) / total, coins: Coins.cUSD, reduxValue: cusd.price },
                    { amount: pCeur, per_24: currencies.cEUR?.percent_24, percent: (pCeur * 100) / total, coins: Coins.cEUR, reduxValue: ceur.price },
                    { amount: pUbe, per_24: currencies.UBE?.percent_24, percent: (pUbe * 100) / total, coins: Coins.UBE, reduxValue: ube.price },
                    { amount: pMoo, per_24: currencies.MOO?.percent_24, percent: (pMoo * 100) / total, coins: Coins.MOO, reduxValue: moo.price },
                    { amount: pMobi, per_24: currencies.MOBI?.percent_24, percent: (pMobi * 100) / total, coins: Coins.MOBI, reduxValue: mobi.price },
                    { amount: pPoof, per_24: currencies.POOF?.percent_24, percent: (pPoof * 100) / total, coins: Coins.POOF, reduxValue: poof.price }
                ]))
            }

        })
    })


    // const { data: balance, error, isLoading } = transactionAPI.endpoints.getBalance.select()(store)
    // const { data, isLoading: currencyLoading } = transactionAPI.endpoints.getCurrencies.select()(store)


    return true;

}

export default Initalization;