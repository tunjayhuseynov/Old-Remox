import { updateAllCurrencies, updateUserBalance } from "../redux/reducers/currencies";
import { BlockScoutApi, transactionAPI } from "../redux/api";
import { Coins } from "../types/coins";
import store from '../redux/store'
import { setTransactions } from "../redux/reducers/transactions";

const Initalization = () => {
    const storage = store.getState().storage;
    if (storage.user !== null && storage.user.accountAddress !== null) {
        const currencyResult = store.dispatch(
            transactionAPI.endpoints.getCurrencies.initiate()
        )

        currencyResult.then((res) => {
            const updatedCurrency = res.data?.data.map(d => ({
                price: d.price,
                percent_24: d.percent_24
            }))

            store.dispatch(updateAllCurrencies(
                updatedCurrency
            ))



            const currencies = store.getState().currencies.coins

            const celo = currencies.CELO
            const cusd = currencies.cUSD
            const ceur = currencies.cEUR
            const ube = currencies.UBE
            const moo = currencies.MOO
            const mobi = currencies.MOBI
            const poof = currencies.POOF

            const balanceResult = store.dispatch(
                transactionAPI.endpoints.getBalance.initiate()
            )

            const transactionsResult = store.dispatch(
                BlockScoutApi.endpoints.getTransactions.initiate(store.getState().storage.user!.accountAddress)
            )

            transactionsResult.then((res) => {
                if(res.data){
                    console.log(res.data)
                    store.dispatch(setTransactions(res.data))
                }
                transactionsResult.unsubscribe()
            })

            balanceResult.then((balanceResponse) => {
                const balance = balanceResponse.data;
                if (balance && celo && cusd && ceur && ube && moo && mobi && poof && store.getState().currencies.coins.CELO) {
                    const pCelo = parseFloat(balance.celoBalance);
                    const pCusd = parseFloat(balance.cUSDBalance);
                    const pCeur = parseFloat(balance.cEURBalance);
                    const pUbe = parseFloat(balance.UBE);
                    const pMoo = parseFloat(balance.MOO);
                    const pMobi = parseFloat(balance.MOBI);
                    const pPoof = parseFloat(balance.POOF);

                    const celoPrice = pCelo * (celo.price ?? 0);
                    const cusdPrice = pCusd * (cusd.price ?? 0);
                    const ceurPrice = pCeur * (ceur.price ?? 0);
                    const ubePrice = pUbe * (ube.price ?? 0);
                    const mooPrice = pMoo * (moo.price ?? 0);
                    const mobiPrice = pMobi * (mobi.price ?? 0);
                    const poofPrice = pPoof * (poof.price ?? 0);

                    const total = celoPrice + cusdPrice + mooPrice + + ceurPrice + ubePrice + mobiPrice + poofPrice;

                    const updatedBalance = [
                        { amount: pCelo, per_24: currencies.CELO?.percent_24, percent: (celoPrice * 100) / total, coins: Coins.celo, reduxValue: celo.price },
                        { amount: pCusd, per_24: currencies.cUSD?.percent_24, percent: (cusdPrice * 100) / total, coins: Coins.cUSD, reduxValue: cusd.price },
                        { amount: pCeur, per_24: currencies.cEUR?.percent_24, percent: (ceurPrice * 100) / total, coins: Coins.cEUR, reduxValue: ceur.price },
                        { amount: pUbe, per_24: currencies.UBE?.percent_24, percent: (ubePrice * 100) / total, coins: Coins.UBE, reduxValue: ube.price },
                        { amount: pMoo, per_24: currencies.MOO?.percent_24, percent: (mooPrice * 100) / total, coins: Coins.MOO, reduxValue: moo.price },
                        { amount: pMobi, per_24: currencies.MOBI?.percent_24, percent: (mobiPrice * 100) / total, coins: Coins.MOBI, reduxValue: mobi.price },
                        { amount: pPoof, per_24: currencies.POOF?.percent_24, percent: (poofPrice * 100) / total, coins: Coins.POOF, reduxValue: poof.price }
                    ]

                    store.dispatch(updateUserBalance(updatedBalance))
                }

                currencyResult.unsubscribe();
                balanceResult.unsubscribe();
            })
        })

        return true;
    }
    return false;
}

export default Initalization;