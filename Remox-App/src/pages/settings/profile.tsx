import { FormEvent, useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import Button from "../../components/button";
import { useGetDetailsQuery, useLazyGetDetailsQuery, usePutAccountInfoMutation } from "../../redux/api";


const ProfileSetting = () => {

    const [updateInfo] = usePutAccountInfoMutation()
    const [refetch, { data, isLoading, isFetching }] = useLazyGetDetailsQuery()

    const [isUser, setUser] = useState(false)
    const [isCompany, setCompany] = useState(false)

    useEffect(() => { refetch() }, [])

    const update = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const { name, surname, company }: { [name: string]: HTMLInputElement } = e.target as HTMLFormElement;
        try {
            if (name && surname && !company) {
                setUser(true)
                await updateInfo({
                    companyName: data?.result.companyName ?? "",
                    surname: surname.value,
                    userName: name.value,
                }).unwrap()
                setUser(false)
            } else if (company && !name && !surname) {
                setCompany(true)
                await updateInfo({
                    companyName: company.value,
                    surname: data?.result.surname ?? "",
                    userName: data?.result.userName ?? "",
                }).unwrap()
                setCompany(false)
            }
            refetch()
        } catch (error) {
            console.error(error)
            setCompany(false)
            setUser(false)
        }
    }

    return <div className="px-3 py-5 flex flex-col space-y-10">
        <div>
            <div className="text-lg">Profile</div>
            <div className="text-sm">Edit your account</div>
        </div>
        {!isLoading ?
            <>
                <div className="flex flex-col space-y-3">
                    <form onSubmit={update}>
                        <div>Personal Name</div>
                        <div className="flex space-x-4 items-center max-w-[555px]">
                            <div>
                                <input type="text" defaultValue={data?.result.userName} name="name" className="border px-2 py-2 outline-none border-gray-700 rounded-lg" />
                            </div>
                            <div>
                                <input type="text" name="surname" defaultValue={data?.result.surname} className="border px-2 py-2 outline-none border-gray-700 rounded-lg" />
                            </div>
                            <div className="flex-grow">
                                <Button type="submit" className="px-12 py-2" isLoading={isUser}>Update</Button>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="flex flex-col space-y-3">
                    <form onSubmit={update}>
                        <div>Organization Name</div>
                        <div className="flex space-x-4 items-center max-w-[555px]">
                            <div className="flex-grow">
                                <input type="text" name="company" defaultValue={data?.result.companyName} className="border px-2 py-2 outline-none border-gray-700 rounded-lg w-full" />
                            </div>
                            <div>
                                <Button type="submit" className="px-12 py-2" isLoading={isCompany}>Update</Button>
                            </div>
                        </div>
                    </form>
                </div>
            </> : <div className="flex justify-center"> <ClipLoader /> </div>}
    </div>
}

export default ProfileSetting;