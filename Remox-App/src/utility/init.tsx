import { useDispatch } from "react-redux";
import { CoinFullInfo, CoinGeckoClient, CoinMarketChartResponse } from 'coingecko-api-v3';
import { updateAllCurrencies } from "../redux/reducers/currencies";
import { useEffect } from "react";
import { useGetCurrenciesQuery } from "../redux/api";

const Initalization = () => {
    const dispatch = useDispatch();
    const { data } = useGetCurrenciesQuery();

    useEffect(() => {
        if (data) {
            dispatch(updateAllCurrencies(
                data.data.map(d => ({
                    price: d.price,
                    percent_24: d.percent_24
                }))
            ))
        }
    }, [data])

    return <></>
}

export default Initalization;