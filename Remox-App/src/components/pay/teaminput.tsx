import { Dispatch, MutableRefObject, useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import { Coins } from "../../types/coins";
import { DropDownItem } from "../../types/dropdown";
import { Member } from "../../types/sdk";
import Dropdown from "../dropdown";
import { CoinsName } from "../../types";


const TeamInput = (props: Member & { index: number, selectedId: string[], generalWallet: DropDownItem, setGeneralWallet: Dispatch<DropDownItem>, setSelectedId: Dispatch<string[]>, members: Array<Member & { selected: boolean }>, setMembers: Dispatch<Array<Member & { selected: boolean }>> }) => {

    const [selectedWallet, setSelectedWallet] = useState<DropDownItem>({ name: Coins[props.currency].name, type: Coins[props.currency].value, value: Coins[props.currency].value, coinUrl: Coins[props.currency].coinUrl })
    const [selectedWallet2, setSelectedWallet2] = useState<DropDownItem>()

    useEffect(() => {
        if (props.secondaryCurrency) {
            setSelectedWallet2({ name: Coins[props.secondaryCurrency].name, type: Coins[props.secondaryCurrency].value, value: Coins[props.secondaryCurrency].value, coinUrl: Coins[props.secondaryCurrency].coinUrl })
        }
    }, [])

    useEffect(() => {
        if (selectedWallet && selectedWallet.value) {
            updateValue({ val: '', wallet: true })
        }
    }, [selectedWallet])

    useEffect(() => {
        if (selectedWallet2 && selectedWallet2.value) {
            updateValue({ val: '', wallet: true, is2: true })
        }
    }, [selectedWallet2])

    const updateValue = ({ val, wallet = false, is2 = false, customWallet }: { val: string, wallet?: boolean, is2?: boolean, customWallet?: CoinsName }) => {
        const arr = [...props.members]
        const newArr = arr.reduce<Array<Member & { selected: boolean }>>((a, e) => {
            if (e.id !== props.id) a.push(e)
            else {
                let newItem;
                if (wallet && is2) {
                    if (customWallet) {
                        newItem = { ...e, secondaryCurrency: customWallet }
                    } else {
                        newItem = { ...e, secondaryCurrency: selectedWallet2!.value! }
                    }
                }
                else if (!wallet && is2) {
                    newItem = { ...e, secondaryAmount: val }
                }
                else if (wallet) {
                    if (customWallet) {
                        newItem = { ...e, currency: customWallet }
                    } else {
                        newItem = { ...e, currency: selectedWallet.value! }
                    }
                } else {
                    newItem = { ...e, amount: val }
                }
                a.push(newItem)
            }
            return a;
        }, [])
        props.setMembers(newArr)
    }

    const updateTick = ({ tick }: { tick: boolean }) => {
        if (!tick) {
            props.setSelectedId(props.selectedId.filter(w => w !== props.id))
        } else {
            props.setSelectedId([...props.selectedId, props.id])
        }
    }

    return <>
        <div className="flex items-center">
            <input checked={props.selectedId.some(w => w === props.id)} className="relative cursor-pointer w-[20px] h-[20px] checked:before:absolute checked:before:w-full checked:before:h-full checked:before:bg-primary checked:before:block" type="checkbox" onChange={(e) => {
                updateTick({ tick: e.target.checked })
            }} />
            <h2 className={`text-black px-3 py-1 name__${props.index} text-sm`}>{props.name}</h2>
        </div>
        <div className="flex items-center">
            <h2 className={`text-black py-1 rounded-md address__${props.index} text-sm truncate`}>{props.address}</h2>
        </div>
        {/* <div className="col-span-2 sm:col-span-1 flex border border-greylish rounded-md border-opacity-60">
            <input className="text-black py-1 outline-none ml-2 rounded-md w-full font-bold unvisibleArrow" placeholder="Amount" defaultValue={props.amount} type="number" name={`amount__${props.index}`} min="0" required step={'any'} onBlur={d => props.setSelectedId([...props.selectedId])} onChange={e => updateValue({ val: e.target.value })} />
            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet} nameActivation={true} selected={selectedWallet} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))} />}
        </div> */}
        <div className={`col-span-2 sm:col-span-1 border text-black py-1 rounded-md grid ${props.usdBase ? "grid-cols-[40%,15%,45%]" : "grid-cols-[50%,50%]"}`}>
            <input className="outline-none unvisibleArrow pl-2" placeholder="Amount" defaultValue={props.amount} type="number" name={`amount__${props.index}`} onChange={(e) => {
                updateValue({ val: e.target.value })
            }} required step={'any'} min={0} />
            {props.usdBase && <span className="text-xs self-center opacity-70">USD as</span>}
            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet} nameActivation={true} selected={selectedWallet} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))} />}
        </div>
        <div className="hidden sm:block"></div>
        <div></div>
        <div></div>
        {props.secondaryCurrency && selectedWallet2 ? <div className={`col-span-2 sm:col-span-1 border text-black py-1 rounded-md grid ${props.usdBase ? "grid-cols-[40%,15%,45%]" : "grid-cols-[50%,50%]"}`}>
            <input className="outline-none unvisibleArrow pl-2" placeholder="Amount" defaultValue={props?.secondaryAmount} type="number" name={`amount__${props.index}`} onChange={(e) => {
                updateValue({ val: e.target.value, wallet: false, is2: true })
            }}  step={'any'} min={0} />
            {props.usdBase && <span className="text-xs self-center opacity-70">USD as</span>}
            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={setSelectedWallet2} nameActivation={true} selected={selectedWallet2} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))} />}
        </div> : <div className="text-primary cursor-pointer text-sm" onClick={() => {
            setSelectedWallet2({ name: Coins[CoinsName.CELO].name, type: Coins[CoinsName.CELO].value, value: Coins[CoinsName.CELO].value, coinUrl: Coins[CoinsName.CELO].coinUrl })
            updateValue({ val: '', wallet: true, is2: true, customWallet: CoinsName.CELO })
        }}>+ Add another token</div>}
        <div></div>
    </>
}
export default TeamInput;