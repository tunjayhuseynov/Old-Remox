import { useState } from "react";
import { useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";
import useMultisig from "../../../hooks/useMultisig";
import { changeError, changeSuccess } from "../../../redux/reducers/notificationSlice";


const ReplaceOwner = ({ onDisable, ownerAddress }: { onDisable: React.Dispatch<boolean>, ownerAddress: string }) => {

    const { replaceOwner, isReplaceOwnerLoading, refetch } = useMultisig()

    const dispatch = useDispatch()

    const [name, setName] = useState("");
    const [address, setAddress] = useState(ownerAddress);

    return <div className="-my-5 flex flex-col space-y-7">
        <div className="font-bold text-xl">Replace Owner</div>
        {/* <div className="flex flex-col space-y-3">
                <span>New Owner</span>
                <div>
                    <input type="text" placeholder="Owner Name" className="w-[75%] px-3 py-2 border border-black rounded-lg" />
                </div>
            </div> */}
        <div className="flex flex-col space-y-3">
            <span>Wallet Address</span>
            <div>
                <input defaultValue={ownerAddress} onChange={(e) => setAddress(e.target.value)} type="text" placeholder="0xabc..." className="w-full px-3 py-2 border border-black rounded-lg" />
            </div>
        </div>
        <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-5 w-[30%] ">
                <button className="px-3 py-2 bg-primary text-white rounded-xl" onClick={async () => {
                    if (address) {
                        try {
                            await replaceOwner(ownerAddress, address)
                            dispatch(changeSuccess(true))
                            refetch()
                            onDisable(false)
                        } catch (error : any) {
                            console.error(error)
                            dispatch(changeError({ activate: true, text: error?.data?.message }))
                            onDisable(false)
                        }
                    }
                }}>
                    {isReplaceOwnerLoading ? <ClipLoader /> : "Save"}
                </button>
            </div>
        </div>
    </div>
}

export default ReplaceOwner;