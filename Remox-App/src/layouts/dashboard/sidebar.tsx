import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClipLoader } from 'react-spinners';
import { Dropdown } from '../../components';
import Siderbarlist from '../../components/dashboard/sidebarlist'
import Error from '../../components/error';
import Modal from '../../components/modal';
import Success from '../../components/success';
import { useCreateAddressMutation, useGetMultisigAddressesQuery, useImportAddressMutation } from '../../redux/api';
import { changeError, changeSuccess, selectError, selectSuccess } from '../../redux/reducers/notificationSlice';
import { changeAccount, SelectSelectedAccount } from '../../redux/reducers/selectedAccount';
import { selectStorage } from '../../redux/reducers/storage';
import { DropDownItem } from '../../types';
import { generate } from 'shortid'

const Sidebar = () => {

    const { data, refetch, isFetching } = useGetMultisigAddressesQuery()
    const [importMultisig, { isLoading }] = useImportAddressMutation()

    const [createMultisig, { isLoading: createLoading }] = useCreateAddressMutation()

    const storage = useSelector(selectStorage)
    const selectedAccount = useSelector(SelectSelectedAccount)

    const dispatch = useDispatch()
    const isSuccess = useSelector(selectSuccess)
    const isError = useSelector(selectError)

    const [isAccountModal, setAccountModal] = useState(false)
    const [isImportModal, setImportModal] = useState(false)
    const [isCreateModal, setCreateModal] = useState(false)

    const owners = useRef<string[]>([])
    const [ownerAmount, setOwnerAmount] = useState(1)

    const [sign, setSign] = useState<number | undefined>(1)
    const [internalSign, setInternalSign] = useState<number | undefined>(1)

    const importInputRef = useRef<HTMLInputElement>(null)

    const [selectedItem, setItem] = useState<DropDownItem>({ name: storage!.accountAddress === selectedAccount ? "Wallet": "Multisig", address: selectedAccount })

    const importClick = async () => {
        if (importInputRef.current && importInputRef.current.value) {
            try {
                const res = await importMultisig({
                    multisigAddress: importInputRef.current.value
                }).unwrap()
                refetch()
                dispatch(changeSuccess(true))
                // dispatch(changeAccount(res.result.address))
                setImportModal(false)
            } catch (error: any) {
                console.error(error)
                dispatch(changeError({ activate: true, text: (error?.data?.message || "Something went wrong") }))
                setImportModal(false)
            }
        }
    }

    const createClick = async () => {
        if (sign && internalSign && owners.current.length+1 >= sign && owners.current.length+1 >= internalSign ) {
            try {
                const res = await createMultisig({
                    phrase: storage!.encryptedPhrase,
                    owners: owners.current,
                    required: sign,
                    internalRequired: internalSign
                }).unwrap()
                refetch()
                dispatch(changeSuccess(true))
                // dispatch(changeAccount(res.multiSigAddress.address))
                setCreateModal(false)
            } catch (error: any) {
                console.error(error)
                dispatch(changeError({ activate: true, text: (error?.data?.message || "Something went wrong") }))
                setCreateModal(false)
            }
        }
    }

    const [list, setList] = useState<DropDownItem[]>([
        { name: "Remox", address: storage!.accountAddress },
        { name: "+ Multisig Account", address: "", onClick: () => { setAccountModal(true) } },
    ])

    useEffect(() => {
        if (data) {
            setList([list[0], ...data.addresses.map((e, i) => ({ name: `MultiSig ${i+1}`, address: e.address })), list[1]])
        }
    }, [data])

   

    return <div className="flex flex-col gap-14 pl-4 lg:pl-10">
        <div>
            <Dropdown list={list} selected={selectedItem} onSelect={(w) => {
                if (w.address) {
                    setItem(w)
                    dispatch(changeAccount(w.address))
                }
            }} />
        </div>
        <div className="lg:pl-4">
            <Siderbarlist />
        </div>
        {isAccountModal && <Modal onDisable={setAccountModal}>
            <div className="flex flex-col gap-4 mt-[-2rem]">
                <div className="text-center font-semibold">Multi-Signature Account</div>
                <div className="flex space-x-3 border border-black px-5 py-2 rounded-md cursor-pointer items-center" onClick={() => {
                    setCreateModal(true)
                    setAccountModal(false)
                }}>
                    <img src="/icons/teamicon.svg" alt="" />
                    <span>Create Multisig Account</span>
                </div>
                <div className="flex space-x-3 border border-black px-5 py-2 rounded-md cursor-pointer items-center" onClick={() => {
                    setImportModal(true)
                    setAccountModal(false)
                }}>
                    <img src="/icons/teamicon.svg" alt="" />
                    <span>Import Multisig Account</span>
                </div>
            </div>
        </Modal>}
        {isImportModal && <Modal onDisable={setImportModal}>
            <div className="flex flex-col gap-4 mt-[-2rem]">
                <div className="text-center font-semibold">Import MultiSig Account</div>
                <div className="flex flex-col">
                    <span className="text-greylish opacity-35 pl-3">MultiSig Address</span>
                    <input ref={importInputRef} type="text" className="border p-3 rounded-md border-black" placeholder="0xabc..." />
                </div>
                <div className="flex justify-center">
                    <button className="bg-primary px-10 py-2 rounded-xl text-white shadow-custom" onClick={importClick}>
                        {!isLoading ? "Import" : <div><ClipLoader /></div>}
                    </button>
                </div>
            </div>
        </Modal>}
        {
            isCreateModal && <Modal onDisable={setCreateModal}>
                <div className="flex flex-col gap-4 mt-[-2rem]">
                    <div className="text-center font-semibold">Create MultiSig Account</div>
                    <div className="flex flex-col overflow-y-auto max-h-[75vh] space-y-5">
                        <span className="text-black opacity-35 pl-3">Owners</span>
                        <div className="w-full">
                            <input type="text" className="border p-3 rounded-md border-black outline-none w-full text-greylish" value={storage!.accountAddress} disabled />
                        </div>
                        {
                            Array(ownerAmount).fill(' ').map((e, i) => {
                                return <div className="w-full" key={generate()}>
                                    <input type="text" onChange={(e) => { owners.current[i] = e.target.value }} className="border p-3 rounded-md border-black outline-none w-full" placeholder="0xabc..." />
                                </div>
                            })
                        }
                        <div className="cursor-pointer text-center text-greylish opacity-80 px-3" onClick={() => { setOwnerAmount(ownerAmount + 1) }}>+ Add Owner</div>
                        <div className="flex flex-col space-y-8">
                            <div>
                                <span className="text-greylish opacity-35 pl-3">Signatures required to execute TXs</span>
                                <input type="text" className="border p-3 rounded-md border-black outline-none w-full" value={sign} onChange={(e) => { if (!isNaN(+e.target.value)) setSign(+e.target.value || undefined) }} />
                            </div>
                            <div>
                                <span className="text-greylish opacity-35 pl-3">Signatures required to change MultiSig properties</span>
                                <input type="text" className="border p-3 rounded-md border-black outline-none w-full" value={internalSign} onChange={(e) => { if (!isNaN(+e.target.value)) setInternalSign(+e.target.value || undefined) }} />

                            </div>
                        </div>
                        <div className="text-center">
                            <button className="bg-primary px-10 shadow-custom py-2 rounded-xl text-white" onClick={createClick}>
                                {createLoading ? <ClipLoader /> : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        }
        {isSuccess && <Success onClose={(val: boolean) => dispatch(changeSuccess(val))} text="Successfully" />}
        {isError && <Error onClose={(val: boolean) => dispatch(changeError({ activate: val }))} />}
    </div>

}

export default Sidebar;