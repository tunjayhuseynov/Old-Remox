import { useState } from "react";
import { useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";
import useMultisig from "../../../hooks/useMultisig";
import { changeError, changeSuccess } from "../../../redux/reducers/notificationSlice";
import Avatar from "../../avatar";


const AddOwner = ({onDisable} : {onDisable: React.Dispatch<boolean>}) => {

    const { signData, data, addOwner, isAddOwnerLoading, refetch } = useMultisig()

    const [pageIndex, setPageIndex] = useState(0);

    const dispatch = useDispatch()

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");

    return <div className="-my-5 flex flex-col space-y-7">
        <div className="font-bold text-xl">Add Owner</div>
        {pageIndex === 0 && <>
            {/* <div className="flex flex-col space-y-3">
                <span>New Owner</span>
                <div>
                    <input type="text" placeholder="Owner Name" className="w-[75%] px-3 py-2 border border-black rounded-lg" />
                </div>
            </div> */}
            <div className="flex flex-col space-y-3">
                <span>Wallet Address</span>
                <div>
                    <input onChange={(e) => setAddress(e.target.value)} type="text" placeholder="0xabc..." className="w-full px-3 py-2 border border-black rounded-lg" />
                </div>
            </div>
            <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-5 w-[50%] ">
                    <button className="px-3 py-2 border border-primary bg-transparent text-primary rounded-xl" onClick={()=>onDisable(false)}>
                        Close
                    </button>
                    <button className="px-3 py-2 bg-primary text-white rounded-xl" onClick={() => {
                        if (address) {
                            setPageIndex(1)
                        }
                    }}>
                        Next
                    </button>
                </div>
            </div></>}
        {pageIndex === 1 && <>
            <div className="flex border border-primary px-3 py-2 items-center rounded-xl space-x-3">
                <div>
                    <Avatar name="Ow" className="bg-primary text-black bg-opacity-100 font-bold text-xs" />
                </div>
                <div className="flex flex-col">
                    <div>
                        New Owner
                    </div>
                    <div className="text-sm text-greylish">
                        Address: {address}
                    </div>
                    <div className="text-sm text-greylish">
                        Treshold: <span className="font-bold">{signData?.changingMultiSigProperties} out of {data?.length} owners</span>
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-5 w-[50%] ">
                    <button className="px-3 py-2 border border-primary bg-transparent text-primary rounded-xl">
                        Back
                    </button>
                    <button className="px-3 py-2 bg-primary text-white rounded-xl" onClick={async () => {
                        try {
                            await addOwner(address)
                            refetch()
                            dispatch(changeSuccess(true))
                            onDisable(false)
                        } catch (error: any) {
                            console.error(error)
                            dispatch(changeError({ activate: true, text: error?.data?.message }))
                            onDisable(false)
                        }
                    }}>
                        {!isAddOwnerLoading ? "Confirm" : <ClipLoader />}
                    </button>
                </div>
            </div></>}
    </div>
}

export default AddOwner;