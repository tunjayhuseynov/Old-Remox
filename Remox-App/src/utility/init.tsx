import { updateAllCurrencies, updateUserBalance } from "../redux/reducers/currencies";
import { accountAPI, BlockScoutApi, transactionAPI } from "../redux/api";
import { Coins } from "../types/coins";
import store from '../redux/store'
import { setTransactions } from "../redux/reducers/transactions";
import { changeNotificationSeen } from "../redux/reducers/notificationSlice";

const Initalization = () => {
    const storage = store.getState().storage;
    if (storage.user !== null && storage.user.accountAddress !== null) {
        const currencyResult = store.dispatch(
            transactionAPI.endpoints.getCurrencies.initiate()
        )

        const notifySeen = store.dispatch(
            accountAPI.endpoints.getTime.initiate()
        )

        notifySeen.then((res) => {
            if (res.data && res.data.date) {
                store.dispatch(changeNotificationSeen(parseInt(res.data.date)))
                notifySeen.unsubscribe()
            }
        })

        currencyResult.then((res) => {
            const updatedCurrency = res.data?.data.map(d => ({
                price: d.price,
                percent_24: d.percent_24
            }))
            updatedCurrency?.push({price: 0, percent_24: 0})
            store.dispatch(updateAllCurrencies(
                updatedCurrency
            ))
            currencyResult.unsubscribe();


            if (!updatedCurrency) return
            let [Celo, Cusd, Ceur, Ube, Moo, Mobi, Poof, cReal] = updatedCurrency;
            cReal = {
                price: 0,
                percent_24: 0
            }
            const celo = Celo
            const cusd = Cusd
            const ceur = Ceur
            const ube = Ube
            const moo = Moo
            const mobi = Mobi
            const poof = Poof
            const creal = cReal


            const balanceResult = store.dispatch(
                transactionAPI.endpoints.getBalance.initiate()
            )

            const transactionsResult = store.dispatch(
                BlockScoutApi.endpoints.getTransactions.initiate(store.getState().storage.user!.accountAddress)
            )

            transactionsResult.then((res) => {
                if (res.data) {
                    store.dispatch(setTransactions(res.data))
                }
                transactionsResult.unsubscribe()
            })

            balanceResult.then((balanceResponse) => {
                const balance = balanceResponse.data;
                if (balance && celo && cusd && ceur && ube && moo && mobi && poof && cReal) {
                    const pCelo = parseFloat(balance.celoBalance);
                    const pCusd = parseFloat(balance.cUSDBalance);
                    const pCeur = parseFloat(balance.cEURBalance);
                    const pUbe = parseFloat(balance.UBE);
                    const pMoo = parseFloat(balance.MOO);
                    const pMobi = parseFloat(balance.MOBI);
                    const pPoof = parseFloat(balance.POOF);
                    const pReal = parseFloat(balance.cREAL);

                    const celoPrice = pCelo * (celo.price ?? 0);
                    const cusdPrice = pCusd * (cusd.price ?? 0);
                    const ceurPrice = pCeur * (ceur.price ?? 0);
                    const ubePrice = pUbe * (ube.price ?? 0);
                    const mooPrice = pMoo * (moo.price ?? 0);
                    const mobiPrice = pMobi * (mobi.price ?? 0);
                    const poofPrice = pPoof * (poof.price ?? 0);
                    const realPrice = pReal * (creal.price ?? 0);


                    const total = celoPrice + cusdPrice + mooPrice + + ceurPrice + ubePrice + mobiPrice + poofPrice + realPrice;

                    const updatedBalance = [
                        { amount: pCelo, per_24: Celo.percent_24, percent: (celoPrice * 100) / total, coins: Coins.celo, tokenPrice: celo.price },
                        { amount: pCusd, per_24: Cusd.percent_24, percent: (cusdPrice * 100) / total, coins: Coins.cUSD, tokenPrice: cusd.price },
                        { amount: pCeur, per_24: Ceur.percent_24, percent: (ceurPrice * 100) / total, coins: Coins.cEUR, tokenPrice: ceur.price },
                        { amount: pUbe, per_24: Ube.percent_24, percent: (ubePrice * 100) / total, coins: Coins.UBE, tokenPrice: ube.price },
                        { amount: pMoo, per_24: Moo.percent_24, percent: (mooPrice * 100) / total, coins: Coins.MOO, tokenPrice: moo.price },
                        { amount: pMobi, per_24: Mobi.percent_24, percent: (mobiPrice * 100) / total, coins: Coins.MOBI, tokenPrice: mobi.price },
                        { amount: pPoof, per_24: Poof.percent_24, percent: (poofPrice * 100) / total, coins: Coins.POOF, tokenPrice: poof.price },
                        { amount: pReal, per_24: cReal.percent_24, percent: (realPrice * 100) / total, coins: Coins.cREAL, tokenPrice: creal.price },
                    ]

                    store.dispatch(updateUserBalance(updatedBalance))
                }

                balanceResult.unsubscribe();
            })
        })

        return true;
    }
    return false;
}

export default Initalization;