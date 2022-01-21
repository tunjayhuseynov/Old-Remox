import { Dispatch, SyntheticEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";
import { useLazyGetMemberQuery, useLazyGetTeamsQuery, useUpdateMemberMutation } from "../../../redux/api";
import { changeSuccess } from "../../../redux/reducers/notificationSlice";
import { Coins, CoinsURL } from "../../../types/coins";
import { DropDownItem } from "../../../types/dropdown";
import { Interval, Member } from "../../../types/sdk";
import Dropdown from "../../dropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "../../button";


const EditMember = (props: Member & { onCurrentModal: Dispatch<boolean> }) => {
    const dispatch = useDispatch()

    const [triggerTeam, { data, isLoading }] = useLazyGetTeamsQuery()

    const [getMembers, { data: member, isLoading: memberLoading, isFetching }] = useLazyGetMemberQuery()

    const [updateMember, { isLoading: updateLoading }] = useUpdateMemberMutation()

    const [selectedTeam, setSelectedTeam] = useState<DropDownItem>({ name: "No Team", coinUrl: CoinsURL.None })
    const [secondActive, setSecondActive] = useState(false)

    const [startDate, setStartDate] = useState<Date>(new Date());


    const [selectedFrequency, setSelectedFrequency] = useState<DropDownItem>({ name: "Monthly", type: Interval.monthly })
    const [selectedWallet, setSelectedWallet] = useState<DropDownItem>({ name: Coins[props.currency].name, type: Coins[props.currency].value, value: Coins[props.currency].value, id: Coins[props.currency].value, coinUrl: Coins[props.currency].coinUrl });
    const [selectedWallet2, setSelectedWallet2] = useState<DropDownItem>();

    const [selectedType, setSelectedType] = useState(props.usdBase)
    useEffect(() => {
        triggerTeam({ take: Number.MAX_SAFE_INTEGER })
        getMembers(props.id)
        setSecondActive(!(!props.secondaryAmount))
        if (props.interval) {
            setSelectedFrequency(props.interval === Interval.monthly ? { name: "Monthly", type: Interval.monthly } : { name: "Weekly", type: Interval.weakly })
        }
        if (props.paymantDate) {
            setStartDate(new Date(props.paymantDate))
        }
        if (props.secondaryCurrency) {
            setSelectedWallet2({ name: Coins[props.secondaryCurrency].name, type: Coins[props.secondaryCurrency].value, value: Coins[props.secondaryCurrency].value, id: Coins[props.secondaryCurrency].value, coinUrl: Coins[props.secondaryCurrency].coinUrl })
        }
    }, [])

    useEffect(() => {
        if (member && data) {
            setSelectedTeam({ name: data.teams.find(w => w.id === member.member.teamId)!.title, coinUrl: CoinsURL.None, id: member.member.teamId })
        }
    }, [member, data])

    const Submit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { memberName, amount, address, amount2 } = e.target as HTMLFormElement;

        if (memberName && amount && address && selectedWallet && selectedTeam) {
            if (!selectedWallet.value) {
                alert("Please, choose a Celo wallet")
                return
            }
            if (!selectedTeam.id) {
                alert("Please, choose a team")
                return
            }
            const memberNameValue = (memberName as HTMLInputElement).value
            const amountValue = (amount as HTMLInputElement).value
            const addressValue = (address as HTMLInputElement).value
            const amountValue2 = (amount2 as HTMLInputElement)?.value

            let member: Member = {
                id: props.id,
                name: memberNameValue,
                address: addressValue,
                amount: amountValue,
                currency: selectedWallet.value,
                teamId: selectedTeam.id,
                usdBase: selectedType,

                interval: selectedFrequency!.type as Interval,
                paymantDate: startDate!.toISOString(),
            }

            if (amountValue2 && selectedWallet2 && selectedWallet2.value) {
                member = {
                    ...member,
                    secondaryAmount: amountValue2.trim(),
                    secondaryCurrency: selectedWallet2.value,
                    secondaryUsdBase: selectedType,
                }
            }

            try {
                await updateMember(member).unwrap()
                dispatch(changeSuccess({ activate: true, text: "Member updated successfully" }))
            } catch (error) {
                console.error(error)
            }

        }
    }

    return <>
        <div>
            {!memberLoading && !isFetching && member ? <form onSubmit={Submit}>
                <div className="text-xl font-bold pb-3">
                    Personal Details
                </div>
                <div className="grid grid-cols-2 gap-y-10">
                    <div className="flex flex-col space-y-3">
                        <div className="font-bold">Name</div>
                        <div className="flex space-x-2 items-center w-3/4">
                            <input name="memberName" type="text" defaultValue={member.member!.name} className="w-full border-2 border-black border-opacity-50 outline-none rounded-md px-3 py-2" required />
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <div className="font-bold">Team</div>
                        <div>
                            <div className="flex space-x-2 items-center w-3/4">
                                <Dropdown onSelect={setSelectedTeam} parentClass="w-full" loader={isLoading} selected={selectedTeam} list={data?.teams && data.teams.length > 0 ? [...data.teams.map(w => { return { name: w.title, coinUrl: CoinsURL.None, id: w.id } })] : []} nameActivation={true} className="border-2 rounded-md w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3 col-span-2">
                        <div className="font-bold">Wallet Address</div>
                        <div className="flex space-x-2 items-center w-full">
                            <input name="address" type="text" defaultValue={member.member!.address} className="w-full  border border-black border-opacity-50 outline-none rounded-md px-3 py-2" required />
                        </div>
                    </div>
                    <div className="col-span-2 flex flex-col space-y-4">
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
                    <div className="col-span-2 flex flex-col space-y-4 w-2/3">
                        <div className={`border text-black py-1 rounded-md grid ${selectedType ? "grid-cols-[40%,15%,45%]" : "grid-cols-[50%,50%]"}`}>
                            <input type="number" defaultValue={member.member!.amount} name="amount" className="outline-none unvisibleArrow pl-2" placeholder="Amount" required step={'any'} min={0} />
                            {selectedType && <span className="text-xs self-center opacity-70">USD as</span>}
                            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet} nameActivation={true} selected={selectedWallet} list={Object.values(Coins)} />}

                        </div>
                    </div>
                    {secondActive && selectedWallet2 ?
                        <div className="col-span-2 flex flex-col space-y-4 w-2/3">
                            <div className={`border text-black py-1 rounded-md grid ${selectedType ? "grid-cols-[40%,15%,45%]" : "grid-cols-[50%,50%]"}`}>
                                <input type="number" defaultValue={member.member!.secondaryAmount} name="amount2" className="outline-none unvisibleArrow pl-2" placeholder="Amount" required step={'any'} min={0} />
                                {selectedType && <span className="text-xs self-center opacity-70">USD as</span>}
                                {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet2} nameActivation={true} selected={selectedWallet2} list={Object.values(Coins)} />}

                            </div>
                        </div> : <div className="text-primary cursor-pointer" onClick={() => setSecondActive(true)}>+ Add another token</div>}
                    <div className="col-span-2 flex flex-col space-y-4 w-1/2">
                        <div className="font-bold">Payment Frequency</div>
                        <div>
                            <Dropdown onSelect={setSelectedFrequency} loader={isLoading} selected={selectedFrequency} list={[{ name: "Monthly", type: Interval.monthly }, { name: "Weekly", type: Interval.weakly }]} nameActivation={true} className="border-2 rounded-md" />
                        </div>
                    </div>
                    <div className="col-span-2 flex flex-col space-y-4 w-1/2">
                        <div className="font-bold">Payment Date</div>
                        <div className="border-2 p-2 rounded-md">
                            <DatePicker selected={startDate} minDate={new Date()} onChange={(date) => date ? setStartDate(date) : null} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center pt-10">
                    <div className="flex justify-center">
                        <div>
                            <Button type='submit' isLoading={updateLoading} className="w-full px-6 py-3">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
                : <div className="flex justify-center"> <ClipLoader /></div>}
        </div>
    </>
}

export default EditMember;