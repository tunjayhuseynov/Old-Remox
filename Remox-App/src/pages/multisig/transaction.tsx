import { useDispatch, useSelector } from "react-redux"
import { useParams, useHistory } from "react-router-dom"
import { useConfirmTransactionsMutation, useGetMultisigTransactionQuery, useRevokeTransactionsMutation } from "../../redux/api"
import useMultisig from '../../hooks/useMultisig'
import { SelectSelectedAccount } from "../../redux/reducers/selectedAccount"
import { ClipLoader } from "react-spinners"
import { selectStorage } from "../../redux/reducers/storage"
import { useEffect, useState } from "react"
import { AltCoins, Coins } from "../../types/coins"
import { changeError, selectError } from "../../redux/reducers/notificationSlice"
import Error from "../../components/error"
import { generate } from "shortid"

const MultisigTransaction = () => {
    const history = useHistory()
    const { id } = useParams<{ id: string }>()
    const selectedAddress = useSelector(SelectSelectedAccount)
    const storage = useSelector(selectStorage)
    const { signData, data, refetch: refreshMultisig } = useMultisig()
    const { isLoading, isFetching, data: transactionData, refetch } = useGetMultisigTransactionQuery({ address: selectedAddress, id })
    const [revokeTransaction, { isLoading: revokeLoading }] = useRevokeTransactionsMutation()
    const [confirmTransaction, { isLoading: confirmLoading }] = useConfirmTransactionsMutation()

    const isError = useSelector(selectError)
    const dispatch = useDispatch()

    const [filterData, setFilterData] = useState<{
        requiredCount?: string,
        owner?: string,
        newOwner?: string,
        valueOfTransfer?: string,
        method?: string
    }>({})

    useEffect(() => {
        if (transactionData) {
            setFilterData({
                requiredCount: transactionData.txResult?.requiredCount,
                owner: transactionData.txResult?.owner,
                newOwner: transactionData.txResult?.newOwner,
                valueOfTransfer: transactionData.txResult?.valueOfTransfer,
                method: transactionData.txResult?.method
            })
        }
    }, [transactionData, isFetching])

    const submitAction = async () => {
        if (!transactionData?.txResult.confirmations.includes(storage!.accountAddress)) {
            try {
                await confirmTransaction({
                    multisigAddress: selectedAddress,
                    transactionId: parseInt(id),
                    phrase: storage!.encryptedPhrase
                }).unwrap()
                refetch()
                refreshMultisig()
            } catch (error: any) {
                console.error(error)
                dispatch(changeError({ activate: true, text: error?.data?.message }));
            }

        } else {
            try {
                await revokeTransaction({
                    multisigAddress: selectedAddress,
                    transactionId: parseInt(id),
                    phrase: storage!.encryptedPhrase
                }).unwrap()
                refetch()
                refreshMultisig()
            } catch (error: any) {
                console.error(error)
                dispatch(changeError({ activate: true, text: error?.data?.message }));
            }
        }
    }


    if (isLoading || isFetching) {
        return <div className="w-full h-screen flex items-center justify-center"> <div><ClipLoader /></div></div>
    }

    return <div className="flex w-[60%] my-14 mx-auto">
        <div className="flex flex-col w-full space-y-10 flex-wrap">
            <div className="flex flex-col space-y-3">
                <div className="font-bold text-lg">
                    Transaction Status
                </div>
                <div>
                    Transaction requires the confirmation of <span className="font-semibold">{transactionData?.txResult.method?.toLowerCase().includes("transfer") ? signData?.executinTransactions : signData?.changingMultiSigProperties} out of {data?.length} owners</span>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-y-5">
                {data?.map((w, i, arr) =>
                    <div key={generate()} className="flex flex-col   gap-4 items-center justify-center w-[120px]" title={w}>
                        <div className={`w-[50px] shadow-custom h-[50px] relative ${w.toLowerCase() === storage!.accountAddress.toLowerCase() ? "bg-[#3EBE11]" : ""} ${i !== 0 ? "before:-translate-x-full before:absolute before:top-1/2 before:w-full before:h-[2px] before:bg-black" : ""} ${i !== arr.length - 1 ? "after:translate-x-full after:absolute after:top-1/2 after:w-full after:h-[2px] after:bg-black " : ""} rounded-full ${transactionData?.txResult.confirmations.includes(w) ? "bg-[#0055FF]" : "bg-[#E90D0D]"}`}></div>
                        <div className="truncate max-w-[120px] font-semibold">
                            {w.toLowerCase() !== storage!.accountAddress.toLowerCase() ? w.split('').reduce((a, c, i, arr) => {
                                return i < 6 || (arr.length - i) < 3 ? a + c : a.split('.').length - 1 < 6 ? a + '.' : a
                            }, '') : "You"}
                        </div>
                        <div className="h-[25px]">
                            {w.toLowerCase() !== storage!.accountAddress.toLowerCase() ? transactionData?.txResult.confirmations.includes(w) ? "Approved" : "Pending" : ""}
                        </div>
                    </div>
                )}
            </div>
            <div className="shadow-custom w-full px-10 py-5">
                <div className="text-xl font-semibold pb-5">Transaction Detail</div>
                <div className="grid" style={{
                    gridTemplateColumns: `repeat(${Object.values(filterData).filter(s => s).length}, minmax(0, 1fr))`
                }}>
                    {filterData.method ? <div className="py-3 border-b border-black">Action Name</div> : null}
                    {filterData.valueOfTransfer ? <div className="py-3 border-b border-black">Amount</div> : null}
                    {filterData.owner ? <div className="py-3 border-b border-black">{filterData.newOwner ? "Old" : "Address"}</div> : null}
                    {filterData.newOwner ? <div className=" py-3 border-b border-black">New</div> : null}
                    {filterData.requiredCount ? <div className=" py-3 border-b border-black">New Signature Threshold</div> : null}
                    {filterData.method ? <div className=" pt-3">{
                        filterData.method!.split('').reduce((acc, w, i) => {
                            if (i === 0) return acc + w.toUpperCase()
                            if (w !== w.toLowerCase() && i > 0) return acc + " " + w
                            return acc + w;
                        }, '')
                    }</div> : null}
                    {filterData.valueOfTransfer ? <div className="flex space-x-3 items-center pt-3">
                        <div>
                            <img src={(Object.values(Coins).find((s: AltCoins) => s.contractAddress.toLowerCase() === transactionData?.txResult.destination.toLowerCase()) as AltCoins).coinUrl} alt="" className='w-[25px] h-[25px]' />
                        </div>
                        <div>{filterData.valueOfTransfer}</div>
                    </div> : null}
                    {filterData.owner ? <div className=" pt-3 text-sm truncate" title={filterData.owner}>{filterData.owner}</div> : null}
                    {filterData.newOwner ? <div className=" pt-3 text-sm truncate" title={filterData.newOwner}>{filterData.newOwner}</div> : null}
                    {filterData.requiredCount ? <div className=" pt-3 text-sm" title={filterData.requiredCount}>{+filterData.requiredCount}</div> : null}
                </div>
            </div>
            <div className="flex justify-center space-x-5">
                <div>
                    <button className="border-2 rounded-xl border-primary px-5 py-2 w-[125px]" onClick={() => history.goBack()}>
                        Back
                    </button>
                </div>
                { transactionData?.txResult.executed ? null : <div>
                    <button onClick={submitAction} className={`${!transactionData?.txResult.confirmations.includes(storage!.accountAddress) ? "bg-[#2D5EFF] border-[#2D5EFF]" : "bg-[#EF2727] border-[#EF2727]"} border-2 text-white px-5 py-2 rounded-xl w-[125px]`}>
                        {revokeLoading || confirmLoading ? <ClipLoader size={15} /> : !transactionData?.txResult.confirmations.includes(storage!.accountAddress) ? "Approve" : "Revoke"}
                    </button>
                </div>}
            </div>
        </div>
        {isError && <Error onClose={(val) => dispatch(changeError({ activate: val, text: '' }))} />}
    </div>
}

export default MultisigTransaction