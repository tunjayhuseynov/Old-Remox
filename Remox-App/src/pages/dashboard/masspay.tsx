import { useState, useRef, useEffect, SyntheticEvent } from "react";
import Dropdown from "../../components/dropdown";
import { generate } from 'shortid'
import { useHistory, useLocation } from 'react-router-dom'
import ClipLoader from "react-spinners/ClipLoader";
import Success from "../../components/success";
import Error from "../../components/error";
import { DropDownItem } from "../../types/dropdown";
import { Member, MultipleTransactionData } from "../../types/sdk";
import { useGetBalanceQuery, useLazyGetTeamsWithMembersQuery, useSendCeloMutation, useSendStableTokenMutation, useSendMultipleTransactionsMutation, useSendAltTokenMutation, useSubmitTransactionsMutation } from "../../redux/api";
import { selectStorage } from "../../redux/reducers/storage";
import TeamInput from "../../components/pay/teaminput";
import { AltCoins, AltcoinsList, Coins, CoinsName, StableTokens, TransactionFeeTokenName } from "../../types/coins";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import lodash from "lodash";
import { IBalanceItem, SelectBalances } from "../../redux/reducers/currencies";
import { changeError, selectError } from "../../redux/reducers/notificationSlice";
import Initalization from "../../utility/init";
import { SelectSelectedAccount } from "../../redux/reducers/selectedAccount";
import { useRefetchData } from "../../hooks";


const MassPay = () => {

    const { state } : {state: {memberList?: Member[]}} = useLocation()
    const memberList = state?.memberList
    
    const storage = useAppSelector(selectStorage)
    const selectedAccount = useAppSelector(SelectSelectedAccount)
    const isError = useAppSelector(selectError)
    const balance = useAppSelector(SelectBalances)
    const router = useHistory();
    const dispatch = useAppDispatch()

    // const { data, refetch } = useGetBalanceQuery()
    const [refetch] = useRefetchData(true)

    const [sendCelo] = useSendCeloMutation()
    const [sendStableToken] = useSendStableTokenMutation()
    const [sendMultiple] = useSendMultipleTransactionsMutation()
    const [sendAltcoin] = useSendAltTokenMutation()

    const [sendMultisig] = useSubmitTransactionsMutation()


    const [getTeams, { data: teams, isLoading: teamLoading }] = useLazyGetTeamsWithMembersQuery()


    const [isPaying, setIsPaying] = useState(false)
    const [isSuccess, setSuccess] = useState(false)


    const [selectedWallet, setSelectedWallet] = useState<DropDownItem>();
    const [selectedTeam, setSelectedTeam] = useState<DropDownItem | undefined>(memberList ? { name: "Custom", address: "0" } : undefined);

    // const resMember = useRef<Array<Member & { selected: boolean }>>([])
    const [resMember, setResMember] = useState<Array<Member & { selected: boolean }>>(memberList ? memberList.map(w => ({ ...w, selected: false })) : [])
    const [members, setMembers] = useState<Member[] | undefined>(memberList);
    const [selectedId, setSelectedId] = useState<string[]>([]);

    const [list, setList] = useState<Array<DropDownItem>>([]);


    useEffect(() => {
        getTeams({ take: Number.MAX_SAFE_INTEGER })
        refetch()
    }, [])


    useEffect(() => {
        if (balance && balance.CELO) {
            setSelectedWallet({ name: "Set all to", address: "" })
            const coins = Object.values(balance).map((coin: IBalanceItem) => ({
                name: `${coin.amount.toFixed(3)} ${coin.coins.name}`,
                type: coin.coins.value.toString(),
                value: coin.coins.value,
                coinUrl: coin.coins.coinUrl,
                amount: coin.amount.toString(),
            }))
            setList(coins)
        }
    }, [balance])

    useEffect(() => {
        if (teams && teams.teams.length && !memberList) {
            setSelectedTeam({ name: teams.teams[0].title, address: teams.teams[0].id })
        }
    }, [teams])

    useEffect(() => {
        if (teams && teams.teams.length && selectedTeam && selectedTeam.address && selectedTeam.name.toLowerCase() !== "custom") {
            const team = teams.teams.find(w => w.id === selectedTeam.address)
            if (team && team.members) {
                setResMember(team.members.map(w => ({ ...w, selected: false })))
            }
            setMembers(teams.teams.find(w => w.id === selectedTeam.address)!.members)
        }
    }, [selectedTeam, teams])

    const Submit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()

        const result: Array<MultipleTransactionData> = []

        const mems = resMember.filter(w => selectedId.includes(w.id))

        if (mems.length) {
            for (let index = 0; index < mems.length; index++) {
                let amount;
                if (mems[index].usdBase) {
                    amount = (parseFloat(mems[index].amount) * (balance[mems[index].currency as keyof typeof balance]?.tokenPrice ?? 1)).toString()
                } else {
                    amount = mems[index].amount
                }
                result.push({
                    toAddress: mems[index].address,
                    amount,
                    tokenType: mems[index].currency
                })

                let secAmount = mems[index].secondaryAmount, secCurrency = mems[index].secondaryCurrency;

                if (secAmount && secCurrency) {
                    if (mems[index].secondaryAmount) {
                        secAmount = (parseFloat(secAmount) * (balance[mems[index].secondaryCurrency as keyof typeof balance]?.tokenPrice ?? 1)).toString()
                    }

                    result.push({
                        toAddress: mems[index].address,
                        amount: secAmount,
                        tokenType: secCurrency
                    })
                }
            }
        }

        setIsPaying(true)

        try {
            if (storage!.accountAddress.toLowerCase() === selectedAccount.toLowerCase()) {
                if (result.length === 1) {
                    if (result[0].tokenType === CoinsName.CELO) {
                        await sendCelo({
                            toAddress: result[0].toAddress,
                            amount: result[0].amount,
                            phrase: storage!.encryptedPhrase
                        }).unwrap

                    } else if (result[0].tokenType === CoinsName.cUSD || result[0].tokenType === CoinsName.cEUR) {
                        await sendStableToken({
                            toAddress: result[0].toAddress,
                            amount: result[0].amount,
                            phrase: storage!.encryptedPhrase,
                            stableTokenType: StableTokens[(result[0].tokenType)]
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
                else {
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
                if (result.length === 1) {
                    await sendMultisig({
                        toAddress: result[0].toAddress,
                        multisigAddress: selectedAccount,
                        phrase: storage!.encryptedPhrase,
                        tokenType: result[0].tokenType,
                        value: result[0].amount,
                    }).unwrap()
                }
                else {
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
            refetch()
            // Initalization();


        } catch (error: any) {
            console.error(error)
            dispatch(changeError({ activate: true, text: error?.data?.message.slice(0, 80) }));
        }


        setIsPaying(false);
    }


    return <div>
        <form onSubmit={Submit}>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-[95%] sm:w-[85vw] min-h-[75vh]">
                    <div className="w-full">
                        <div className="pl-14 text-xl font-semibold">Mass Payout</div>
                    </div>
                    <div className=" h-auto shadow-xl rounded-xl border flex flex-col gap-10 py-10">
                        {!teamLoading && teams && teams.teams.length === 0 ? <div className="flex justify-center">No Team Yet. Please, first, create a team</div> : <><div className="flex flex-col px-4 sm:pl-12 sm:pr-[25%] gap-10">
                            <div className="flex flex-col space-y-3">
                                <span className="text-left text-sm font-semibold">Paying From</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 sm:gap-x-10">
                                    {!(teams && selectedTeam) ? <ClipLoader /> : <Dropdown className="h-full" disableAddressDisplay={true} onSelect={setSelectedTeam} nameActivation={true} selected={selectedTeam} list={teams.teams.map(w => ({ name: w.title, address: w.id }))} />}
                                    {/* {!(balance && balance.CELO && selectedWallet) ? <ClipLoader /> : <Dropdown onSelect={setSelectedWallet} nameActivation={true} selected={selectedWallet} list={list} disableAddressDisplay={true} />} */}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex justify-between py-4 items-center">
                                    <span className="text-left font-semibold">Team Details</span>
                                    <div className="flex space-x-2 items-center">
                                        <input type="checkbox" className="relative cursor-pointer w-[20px] h-[20px] checked:before:absolute checked:before:w-full checked:before:h-full checked:before:bg-primary checked:before:block" onChange={(e) => {
                                            if (e.target.checked) setSelectedId(resMember.map(w => w.id))
                                            else setSelectedId([])
                                        }} />
                                        <button type="button">
                                            Select All
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-[25%,45%,25%,5%] gap-5">
                                    <div className="hidden sm:block font-semibold">Name</div>
                                    <div className="hidden sm:block font-semibold">Address</div>
                                    <div className="hidden sm:block font-semibold">Disbursement</div>
                                    <div className="hidden sm:block"></div>
                                    {teams && resMember && members && members.length > 0 ? resMember.map((w, i) => <TeamInput generalWallet={selectedWallet!} setGeneralWallet={setSelectedWallet} selectedId={selectedId} setSelectedId={setSelectedId} key={w.id} index={i} {...w} members={resMember} setMembers={setResMember} />) : 'No Member Yet'}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-left">Description (Optional)</span>
                                <div className="grid grid-cols-1">
                                    <textarea className="border-2 rounded-xl p-1 outline-none" name="description" id="" cols={30} rows={5}></textarea>
                                </div>
                            </div>
                        </div>
                            <div className="flex justify-center">
                                <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 w-[400px] justify-center gap-5">
                                    <button type="button" className="border-2 border-primary px-3 py-2 text-primary rounded-lg" onClick={() => router.goBack()}>Close</button>
                                    <button type="submit" className="bg-primary px-3 py-2 text-white flex items-center justify-center rounded-lg">{isPaying ? <ClipLoader /> : 'Pay'}</button>
                                </div>
                            </div> </>}
                    </div>
                </div>
            </div>
        </form>
        {isSuccess && <Success onClose={setSuccess} onAction={() => { router.goBack() }} />}
        {isError && <Error onClose={(val) => dispatch(changeError({ activate: false, text: '' }))} />}
    </div>

}

export default MassPay;