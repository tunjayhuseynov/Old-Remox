import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import removeOwner from "../components/settings/owner/removeOwner"
import { useAddOwnerMutation, useReplaceOwnerMutation, useLazyGetOwnersQuery, useLazyGetRequiredSignaturesQuery, useChangeRequiredSignaturesMutation, useChnageInternalRequiredSignaturesMutation, useRemoveOwnerMutation, useLazyGetNotExecutedTransactionsQuery, useLazyGetAllTransactionsQuery, useLazyGetTransactionsByPaginationQuery } from "../redux/api"
import { selectMultisigTransactions, setTransactions } from "../redux/reducers/multisig"
import { SelectSelectedAccount } from '../redux/reducers/selectedAccount'
import { selectStorage } from "../redux/reducers/storage"

const useMultisig = () => {
    const selectedAccount = useSelector(SelectSelectedAccount)
    const storage = useSelector(selectStorage)
    const multiSlice = useSelector(selectMultisigTransactions)
    const [addingOwner, { isLoading: isAddOwnerLoading }] = useAddOwnerMutation()
    const [replacingOwner, { isLoading: isReplaceOwnerLoading }] = useReplaceOwnerMutation()
    const [changeSign, { isLoading: isChangeSignLoading }] = useChangeRequiredSignaturesMutation()
    const [changeInternalSign, { isLoading: isChangeInternalLoading }] = useChnageInternalRequiredSignaturesMutation()
    const [removingOwner, { isLoading: isRemoveLoading }] = useRemoveOwnerMutation()

    const [fetch, { data, isFetching, isLoading }] = useLazyGetOwnersQuery()
    const [signFethch, { data: signData,  }] = useLazyGetRequiredSignaturesQuery()

    const [isMultisig, setIsMultisig] = useState(false)

    //const [multiNonExecutedFetch, { data: multiData }] = useLazyGetNotExecutedTransactionsQuery();
    //const [multiNonExecutedFetch, { data: multiData }] = useLazyGetAllTransactionsQuery();
    const [multiNonExecutedFetch, { data: multiData, isLoading: transactionLoading, isFetching: transactionFetching }] = useLazyGetTransactionsByPaginationQuery();
    const dispatch = useDispatch()

    const fetchTxs = useCallback((disabledTransactionDispatch = false, skip = 0, take = 10) => {
        if (!disabledTransactionDispatch) dispatch(setTransactions([]))
        multiNonExecutedFetch({ address: selectedAccount, skip, take })
    }, [isMultisig, selectedAccount])

    useEffect(() => {
        if (multiData && multiData.transactionArray) {
            if(multiData.transactionArray.length === 0){
                dispatch(setTransactions(undefined))
            }else if(!multiSlice?.some(s=>s.id === multiData.transactionArray[multiData.transactionArray.length-1]?.id)){
                dispatch(setTransactions(multiData.transactionArray))
            }
        }
    }, [multiData])

    useEffect(() => {
        let interval: any;
        if (selectedAccount.toLowerCase() !== storage!.accountAddress.toLowerCase()) {
            fetchTxs()
            setIsMultisig(true)
            fetch({ address: selectedAccount })
            signFethch({ address: selectedAccount })

        } else {
            setIsMultisig(false)
        }

        if (interval) {
            return () => clearInterval(interval)
        }

    }, [selectedAccount])

    const refetch = (disabledTransactionDispatch = false, skip = 0, take = 10) => {
        fetchTxs(disabledTransactionDispatch, skip, take)
        fetch({ address: selectedAccount })
        signFethch({ address: selectedAccount })
    }

    const removeOwner = useCallback(async (ownerAddress) => {
        if (isMultisig) {
            await removingOwner({
                multisigAddress: selectedAccount.toLowerCase(),
                phrase: storage!.encryptedPhrase,
                ownerAddress: ownerAddress.toString()
            }).unwrap()
        }
    }, [isMultisig])

    const changeSigns = useCallback(async (sign: number, internalSign: number) => {
        if (isMultisig) {
            await changeSign({
                multisigAddress: selectedAccount.toLowerCase(),
                phrase: storage!.encryptedPhrase,
                requirement: sign.toString()
            }).unwrap()

            await changeInternalSign({
                multisigAddress: selectedAccount.toLowerCase(),
                phrase: storage!.encryptedPhrase,
                requirement: internalSign.toString()
            }).unwrap()

        }
    }, [isMultisig])

    const addOwner = useCallback(async (newOwner) => {
        if (isMultisig) {
            const res = await addingOwner({
                multisigAddress: selectedAccount.toLowerCase(),
                ownerAddress: newOwner.toLowerCase(),
                phrase: storage!.encryptedPhrase
            }).unwrap()

            return res;
        }
    }, [isMultisig])

    const replaceOwner = useCallback(async (oldOwner, newOwner) => {
        if (isMultisig) {
            const res = await replacingOwner({
                multisigAddress: selectedAccount.toLowerCase(),
                ownerAddress: oldOwner.toLowerCase(),
                phrase: storage!.encryptedPhrase,
                newOwnerAddress: newOwner.toLowerCase()
            }).unwrap()

            return res
        }
    }, [isMultisig])


    if (isMultisig) {
        return { data, isMultisig, signData, fetchTxs, addOwner, replaceOwner, changeSigns, removeOwner, storage, isLoading: isLoading || isFetching, isTransactionLoading: transactionLoading || transactionFetching, isAddOwnerLoading, isReplaceOwnerLoading, isChangeSignLoading: isChangeSignLoading || isChangeInternalLoading, refetch, isRemoveLoading }
    } else {
        return { data: undefined, addOwner, fetchTxs, replaceOwner, changeSigns, removeOwner, storage, signData: undefined, refetch, isMultisig, isTransactionLoading: transactionLoading || transactionFetching, }
    }

}

export default useMultisig;