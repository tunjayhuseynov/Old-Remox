import Input from "../input"
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ClipLoader } from "react-spinners";
import { SyntheticEvent } from "react";
import { useCreatePasswordMutation } from "../../redux/api/account";
import { IStorage, setStorage } from "../../redux/reducers/storage";
import { useAppDispatch } from "../../redux/hooks";
import { setUnlock } from "../../redux/reducers/unlock";
import { changeAccount } from "../../redux/reducers/selectedAccount";
import Button from "../button";

const CreatePassword = ({ phrase }: { phrase: string }) => {
    const [createPassword, { isLoading }] = useCreatePasswordMutation();

    const dispatch = useAppDispatch()
    const router = useNavigate();

    const [isValid, setValid] = useState(false)


    const Submitted = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        if (!isValid) return;

        try {
            const data = await createPassword({ phrase: phrase.trim(), password: target["password"]?.value?.trim() }).unwrap()

            const obj: IStorage = {
                accountAddress: data!.accountAddress,
                encryptedPhrase: data!.encryptedPhrase,
                token: data!.token,
            };

            dispatch(changeAccount(data!.accountAddress));
            dispatch(setUnlock(true))
            dispatch(setStorage(JSON.stringify(obj)))

            router('/dashboard')
        } catch (error) {
            console.error(error)
        }
    }


    return <div className="h-screen">
        <form onSubmit={Submitted} className="h-full">
            <section className="flex flex-col items-center  h-full justify-center gap-10">
                <div className="flex flex-col gap-4">
                    <div className="text-center text-3xl text-primary">Set Account Details</div>
                    <div className="text-center text-greylish tracking-wide font-light text-lg">This password encrypts your accounts on this device.</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-24 gap-y-8">
                    <Input title="Password" name="password" type="password" validation={setValid} className="w-[100%] sm:w-[200px]" limit={6} required={true} />
                </div>
                <div className="flex sm:flex-row flex-col-reverse justify-center items-center gap-10 pt-8">
                    <Button version="second" className="w-[150px] h-[50px] px-2" onClick={() => router('/')}>Back</Button>
                    <Button type="submit" className="w-[150px] h-[50px] px-2" isLoading={isLoading}>Set Password</Button>
                </div>
            </section>
        </form>
    </div>
}

export default CreatePassword;