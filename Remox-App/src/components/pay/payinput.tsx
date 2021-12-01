import { Dispatch, useEffect, useState } from "react";
import { BsFillTrashFill } from "react-icons/bs";
import { ClipLoader } from "react-spinners";
import { Coins } from "../../types/coins";
import { DropDownItem } from "../../types/dropdown";
import Dropdown from "../dropdown";


const Input = ({ index, name, address, selectedWallet, setWallet, setIndex, overallIndex, amount }: { index: number, name: Array<string>, address: Array<string>, selectedWallet: DropDownItem[], setWallet: Dispatch<DropDownItem[]>, setIndex: Dispatch<number>, overallIndex: number, amount: Array<string> }) => {

    useEffect(() => {
        if (!selectedWallet[index]) {
            setWallet([...selectedWallet, Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))[0]])
        }
    }, [])

    return <>
        <input className="border text-black px-3 py-1 rounded-md" placeholder="Name" defaultValue={name[index]} type="text" name={`name__${index}`} onChange={(e) => name[index] = e.target.value} required />
        <input className="border text-black px-3 py-1 rounded-md" placeholder="Address" defaultValue={address[index]} type="text" name={`address__${index}`} onChange={(e) => address[index] = e.target.value} required />
        <div className="border text-black py-1 rounded-md grid grid-cols-[50%,50%]">
            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={val => {
                const wallet = [...selectedWallet];
                wallet[index] = val;
                setWallet(wallet)
            }} nameActivation={true} selected={selectedWallet[index] ?? Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))[0]} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))} />}

            <input className="outline-none" placeholder="Amount" defaultValue={amount[index]} type="number" name={`amount__${index}`} onChange={(e) => amount[index] = e.target.value} required step={'any'} min={0} />
        </div>
        <div className="flex items-center">
            {overallIndex > 1 && <BsFillTrashFill className="text-red-500 cursor-pointer" onClick={()=>{
                name[index] = '';
                address[index] = '';
                amount[index] = '' 
                const val = [...selectedWallet];
                val[index] = Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))[0]
                setWallet(val);
                setIndex(overallIndex-1)
            }}/>}
        </div>
    </>
}
export default Input;