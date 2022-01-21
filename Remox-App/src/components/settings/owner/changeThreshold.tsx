import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Dropdown } from "../..";
import useMultisig from "../../../hooks/useMultisig";
import { changeError, changeSuccess } from "../../../redux/reducers/notificationSlice";
import { DropDownItem } from "../../../types";
import Button from "../../button";


const ChangeTreshold = ({ onDisable }: { onDisable: React.Dispatch<boolean> }) => {

    const { signData, data, isChangeSignLoading, changeSigns, refetch } = useMultisig()

    const [sign, setSign] = useState<DropDownItem>({ name: (signData?.executinTransactions.toString() ?? "1"), address: '' })
    const [internalSign, setInternalSign] = useState<DropDownItem>({ name: (signData?.changingMultiSigProperties.toString() ?? "1"), address: '' })

    const dispatch = useDispatch()

    useEffect(() => {
        if (signData?.executinTransactions) {
            setSign({ name: (signData?.executinTransactions.toString() ?? "1"), address: '' })
        }
        if (signData?.changingMultiSigProperties) {
            setInternalSign({ name: (signData?.changingMultiSigProperties.toString() ?? "1"), address: '' })
        }
    }, [signData])

    if (!data) return <div className="text-center">Select a MultiSig account</div>

    return <div className="-my-5 flex flex-col space-y-7">
        <div className="font-bold text-xl">Replace Owner</div>
        <div className="flex flex-col space-y-3">
            <span>Any transaction requires the confirmation of: </span>
            <div className="flex items-center gap-x-3">
                <Dropdown onSelect={setSign} className="px-3 space-x-2" nameActivation={true} list={Array(data.length).fill('').map((s, i) => ({ name: (i + 1).toString(), address: '' }))} selected={sign} /> out of {data.length} owners
            </div>
        </div>
        <div className="flex flex-col space-y-3">
            <span>Signatures required to change MultiSig properties: </span>
            <div className="flex items-center gap-x-3">
                <Dropdown onSelect={setInternalSign} className="px-3 space-x-2" nameActivation={true} list={Array(data.length).fill('').map((s, i) => ({ name: (i + 1).toString(), address: '' }))} selected={internalSign} /> out of {data.length} owners
            </div>
        </div>
        <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-5 w-[30%] ">
                <Button className="px-3 py-2" isLoading={isChangeSignLoading} onClick={async () => {
                    if (sign.name && internalSign.name) {
                        try {
                            await changeSigns(
                                parseInt(sign.name),
                                parseInt(internalSign.name)
                            )
                            refetch()
                            dispatch(changeSuccess({ activate: true, text: "Successfully" }))
                            onDisable(false)
                        } catch (error: any) {
                            console.error(error)
                            dispatch(changeError({ activate: true, text: error?.data?.message }))
                            onDisable(false)
                        }
                    }
                }}>
                    Save
                </Button>
            </div>
        </div>
    </div>
}

export default ChangeTreshold;