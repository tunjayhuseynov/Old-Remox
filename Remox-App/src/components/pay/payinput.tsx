import { Dispatch, useEffect, useState } from "react";
import { BsFillTrashFill } from "react-icons/bs";
import { ClipLoader } from "react-spinners";
import { generate } from "shortid";
import { Coins } from "../../types/coins";
import { DropDownItem } from "../../types/dropdown";
import Dropdown from "../dropdown";


const Input = ({ index, name, address, selectedWallet, setWallet, setIndex, overallIndex, amount,uniqueArr, setRefreshPage }: { index: number, name: Array<string>, address: Array<string>, selectedWallet: DropDownItem[], setWallet: Dispatch<DropDownItem[]>, setIndex: Dispatch<number>, overallIndex: number, amount: Array<string>, uniqueArr: string[], setRefreshPage: Dispatch<string> }) => {

    const [anotherToken, setAnotherToken] = useState(false)

    useEffect(() => {
        if (!selectedWallet[index] && !selectedWallet[index + 1]) {
            const v = Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))[0];
            setWallet([...selectedWallet, v, v])
            uniqueArr.push(generate())
            uniqueArr.push(generate())
        }

    }, [])

    return <>
        <input className="col-span-2 sm:col-span-1 border text-black px-3 py-1 rounded-md" placeholder="Name" defaultValue={name[index]} type="text" name={`name__${index}`} onChange={(e) => { name[index] = e.target.value; name[index + 1] = e.target.value }}  /> {/* onBlur={(e) => setRefreshPage(generate())}*/}
        <input className="col-span-2 sm:col-span-1 border text-black px-3 py-1 rounded-md" placeholder="Address" defaultValue={address[index]} type="text" name={`address__${index}`} onChange={(e) => { address[index] = e.target.value; address[index + 1] = e.target.value }} required /> {/* onBlur={(e) => setRefreshPage(generate())}*/}
        <div className="col-span-3 sm:col-span-1 border text-black py-1 rounded-md grid grid-cols-[50%,50%]">
            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={val => {
                const wallet = [...selectedWallet];
                wallet[index] = val;
                setWallet(wallet)
            }} nameActivation={true} selected={selectedWallet[index] ?? Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))[0]} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))} />}

            <input className="outline-none" placeholder="Amount" defaultValue={amount[index]} type="number" name={`amount__${index}`} onChange={(e) => amount[index] = e.target.value} onBlur={(e) => setRefreshPage(generate())} required step={'any'} min={0} />
        </div>
        <div className="flex items-center">
            {overallIndex > 1 && <BsFillTrashFill className="text-red-500 cursor-pointer" onClick={() => {
                name.splice(index, 2);
                address.splice(index, 2);
                amount.splice(index, 2);
                uniqueArr.splice(index, 2);
                setWallet([...selectedWallet.filter((s, t) => t !== index && t !== index + 1)]);
                setIndex(overallIndex - 1)
                //setRefreshPage(generate())
            }} />}
        </div>
        <div></div>
        <div></div>
        {anotherToken ? <div className="col-span-3 sm:col-span-1 border text-black py-1 rounded-md grid grid-cols-[50%,50%]">
            {!selectedWallet ? <ClipLoader /> : <Dropdown className="border-transparent text-sm" onSelect={val => {
                const wallet = [...selectedWallet];
                wallet[index + 1] = val;
                setWallet(wallet)
            }} nameActivation={true} selected={selectedWallet[index + 1] ?? Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))[0]} list={Object.values(Coins).map(w => ({ name: w.name, type: w.value, coinUrl: w.coinUrl, value: w.value }))} />}

            <input className="outline-none" placeholder="Amount" defaultValue={amount[index + 1]} type="number" name={`amount__${index + 1}`} onChange={(e) => amount[index + 1] = e.target.value} onBlur={(e) => setRefreshPage(generate())} step={'any'} min={0} />
        </div>
        : 
        <div className="text-primary text-sm cursor-pointer" onClick={() => setAnotherToken(true)}>
            + Add another token
        </div>
        }
        <div></div>

        <div></div>
        <div></div>
        <div></div>
        <div className="mt-5"></div>
    </>
}
export default Input;