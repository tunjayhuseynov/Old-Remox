import React, { SyntheticEvent, useEffect, useState } from "react";
import { AltCoins, Coins, CoinsName, CoinsURL } from "../../../types/coins";
import { DropDownItem } from "../../../types/dropdown";
import Dropdown from "../../dropdown";
import { ClipLoader } from "react-spinners";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks"
import { changeSuccess, changeError, selectError } from '../../../redux/reducers/notificationSlice'
import { useLazyGetTeamsQuery } from "../../../redux/api/team";
import { useAddMemberMutation } from "../../../redux/api/teamMember";
import Error from "../../error";
import { AddMember, Interval } from "../../../types/sdk";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddMemberModal = ({ onDisable }: { onDisable: React.Dispatch<boolean> }) => {

    const isError = useAppSelector(selectError)

    const [triggerTeams, { data, isLoading }] = useLazyGetTeamsQuery()
    const [addMember, { isLoading: addMemberLoading }] = useAddMemberMutation();

    const [secondActive, setSecondActive] = useState(false)

    const [startDate, setStartDate] = useState<Date>(new Date());

    const [selected, setSelected] = useState<DropDownItem>({ name: "No Team", coinUrl: CoinsURL.None })
    const [selectedFrequency, setSelectedFrequency] = useState<DropDownItem>({ name: "Monthly", type: Interval.monthly })
    const [selectedWallet, setSelectedWallet] = useState<DropDownItem>(Coins[CoinsName.CELO]);
    const [selectedWallet2, setSelectedWallet2] = useState<DropDownItem>(Coins[CoinsName.CELO]);

    const [selectedType, setSelectedType] = useState(false)

    const dispatch = useAppDispatch()

    useEffect(() => {
        triggerTeams({ take: Number.MAX_SAFE_INTEGER })
    }, [])

    useEffect(() => {
        if (!data || (data && data.teams.length === 0)) {
            setSelected({ name: "No Team", coinUrl: CoinsURL.None })
        }
    })

    useEffect(() => {
        if (data && data.teams && data.teams.length > 0) {
            setSelected({ name: "Select Team", coinUrl: CoinsURL.None })
        }
    }, [data])


    const Submit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()

        const target = e.target as HTMLFormElement;

        const { firstName, lastName, teamName, walletAddress, amount, amount2 } = target;
        const firstNameValue = (firstName as HTMLInputElement).value
        const lastNameValue = (lastName as HTMLInputElement).value
        // const teamNameValue = (teamName as HTMLInputElement)?.value
        const walletAddressValue = (walletAddress as HTMLInputElement).value
        const amountValue = (amount as HTMLInputElement).value
        const amountValue2 = (amount2 as HTMLInputElement)?.value
        console.log(amountValue2, amount2)

        if (firstNameValue && lastNameValue && walletAddressValue && amountValue) {
            if (!Object.values(Coins).includes(selectedWallet as AltCoins)) {
                alert("Please, choose a wallet")
                return
            }
            if (selected === { name: "Select Team", coinUrl: CoinsURL.None }) {
                alert("Please, choose a team")
                return
            }

            if (selectedWallet.value && selected.id) {

                try {

                    let sent: AddMember = {
                        name: `${firstNameValue} ${lastNameValue}`,
                        address: walletAddressValue.trim(),
                        currency: selectedWallet.value,
                        amount: amountValue.trim(),
                        teamId: selected.id,
                        usdBase: selectedType,

                        interval: selectedFrequency!.type as Interval,
                        paymantDate: startDate!.toISOString(),
                    }

                    if (amountValue2 && selectedWallet2.value) {
                        sent = {
                            ...sent,
                            secondaryAmount: amountValue2.trim(),
                            secondaryCurrency: selectedWallet2.value,
                            secondaryUsdBase: selectedType,
                        }
                    }

                    await addMember(sent).unwrap()

                    dispatch(changeSuccess(true))
                    onDisable(false)
                } catch (error: any) {
                    console.error(error)
                    dispatch(changeError({ activate: true, text: error?.data?.message }))
                }
            }
        }
    }

    return <>
        <form onSubmit={Submit}>
            <div className="flex flex-col space-y-8">
                <div className="flex flex-col space-y-4">
                    <div className="font-bold">Personal Details</div>
                    <div className="grid grid-cols-2 gap-x-10">
                        <div>
                            <input type="text" name="firstName" placeholder="First Name" className="border-2 pl-2 rounded-md outline-none h-[42px] w-full" required />
                        </div>
                        <div>
                            <input type="text" name="lastName" placeholder="Last Name" className="border-2 pl-2 rounded-md outline-none h-[42px] w-full" required />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="font-bold">Choose Team</div>
                    <div className="grid grid-cols-2 w-[85%] gap-x-10">
                        <div>
                            <Dropdown onSelect={setSelected} loader={isLoading} selected={selected} list={data?.teams && data.teams.length > 0 ? [...data.teams.map(w => { return { name: w.title, coinUrl: CoinsURL.None, id: w.id } })] : []} nameActivation={true} className="border-2 rounded-md" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="font-bold">Wallet Address</div>
                    <div>
                        <input type="text" name="walletAddress" className="h-[42px] w-full rounded-lg border-2 pl-2 outline-none" placeholder="Wallet Address" required />
                    </div>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="flex space-x-24">
                        <div className="flex space-x-2 items-center">
                            <input type="radio" className="w-4 h-4 accent-[#ff501a] cursor-pointer" name="paymentType" value="token" onChange={(e) => setSelectedType(false)} checked={!selectedType} />
                            <label className="font-semibold text-sm">
                                Token Amounts
                            </label>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <input type="radio" className="w-4 h-4 accent-[#ff501a] cursor-pointer" name="paymentType" value="fiat" onChange={(e) => setSelectedType(true)} checked={selectedType} />
                            <label className="font-semibold text-sm">
                                USD-based Amounts
                            </label>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col space-y-4 w-2/3">
                    <div className={`border text-black py-1 rounded-md grid ${selectedType ? "grid-cols-[40%,15%,45%]" : "grid-cols-[50%,50%]"}`}>
                        <input type="number" name="amount" className="outline-none unvisibleArrow pl-2" placeholder="Amount" required step={'any'} min={0} />
                        {selectedType && <span className="text-xs self-center opacity-70">USD as</span>}
                        {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet} nameActivation={true} selected={selectedWallet} list={Object.values(Coins)} />}

                    </div>
                </div>
                {secondActive ?
                    <div className="flex flex-col space-y-4 w-2/3">
                        <div className={`border text-black py-1 rounded-md grid ${selectedType ? "grid-cols-[40%,15%,45%]" : "grid-cols-[50%,50%]"}`}>
                            <input type="number" name="amount2" className="outline-none unvisibleArrow pl-2" placeholder="Amount" required step={'any'} min={0} />
                            {selectedType && <span className="text-xs self-center opacity-70">USD as</span>}
                            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet2} nameActivation={true} selected={selectedWallet2} list={Object.values(Coins)} />}

                        </div>
                    </div> : <div className="text-primary cursor-pointer" onClick={() => setSecondActive(true)}>+ Add another token</div>}
                <div className="flex flex-col space-y-4 w-1/2">
                    <div className="font-bold">Payment Frequency</div>
                    <div>
                        <Dropdown onSelect={setSelectedFrequency} loader={isLoading} selected={selectedFrequency} list={[{ name: "Monthly", type: Interval.monthly }, { name: "Weekly", type: Interval.weakly }]} nameActivation={true} className="border-2 rounded-md" />
                    </div>
                </div>
                <div className="flex flex-col space-y-4 w-1/2">
                    <div className="font-bold">Payment Date</div>
                    <div className="border-2 p-2 rounded-md">
                        <DatePicker selected={startDate} minDate={new Date()} onChange={(date) => date ? setStartDate(date) : null} />
                    </div>
                </div>
                {/* {isError && <Error onClose={(val)=>dispatch(changeError({activate: val, text: ''}))} />} */}
                <div className="flex justify-center">
                    <button className="px-8 py-3 bg-primary rounded-xl text-white">
                        {addMemberLoading ? <ClipLoader /> : "Add Person"}
                    </button>
                </div>
            </div>
        </form>
    </>
}

export default AddMemberModal;