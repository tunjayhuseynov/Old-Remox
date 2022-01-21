import { useMemo, Dispatch } from 'react';
import Input from '../input'
import { useNavigate } from 'react-router-dom'
import { generate } from 'shortid'
import { AccountCreate } from '../../types/sdk';
import { SyntheticEvent } from 'react';
import { PassDataFromSetToPhrase } from '../../types/create'
import { useAccountCreateMutation } from '../../redux/api/account';
import { ClipLoader } from 'react-spinners';
import Button from '../button';

// SET Component
const Set = ({ setData }: { setData: Dispatch<PassDataFromSetToPhrase> }) => {

    const [createAccount, { isLoading }] = useAccountCreateMutation()


    const router = useNavigate()

    const list = useMemo<Array<{ title: string, type?: string, name: string }>>(() => [
        { title: "First Name", name: "userName" }, { title: "Last Name", name: "surname" },
        { title: "Organization Name", name: "companyName" }, { title: "Password", name: "password", type: "password", limit: 6 },
    ], [])

    const create = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement

        if (target["password"].value !== target["repeatPassword"].value) return

        const inputData: AccountCreate = {
            userName: target["userName"].value,
            surname: target["surname"].value,
            companyName: target["companyName"].value,
            password: target["password"].value,
        }

        try {
            const data = await createAccount(inputData).unwrap()

            const obj = {
                accountAddress: data.accountAddress,
                encryptedPhrase: data.encryptedPhrase,
                token: data.token,
                userName: inputData.userName,
                surname: inputData.surname,
                companyName: inputData.companyName,
            };

            // dispatch(setStorage(JSON.stringify(obj)))

            const pass: PassDataFromSetToPhrase = {
                accountAddress: data.accountAddress,
                mnemonic: data.mnemonic,
                localSave: obj,
            }

            setData(pass)
        } catch (error) {
            console.error(error)
        }
    }

    return <>{!isLoading ? <form onSubmit={create} className="py-[100px] sm:py-0 sm:h-full">
        <section className="flex flex-col items-center  h-full justify-center gap-10">
            <div className="flex flex-col gap-4">
                <div className="text-xl sm:text-3xl text-primary text-center">Set Account Details</div>
                <div className="text-greylish tracking-wide font-light text-lg text-center">This password encrypts your accounts on this device.</div>
            </div>
            <div className="grid sm:grid-cols-3 gap-x-24 gap-y-8 px-3">
                {list.map(w => <Input key={generate()} {...w} />)}
            </div>
            <div className="flex sm:flex-row flex-col-reverse justify-center items-center gap-10 pt-8">
                <Button version="second" className="w-[150px] h-[50px]" onClick={() => router('/')}>Back</Button>
                <Button className="w-[150px] h-[50px] px-2">Set Account</Button>
            </div>
        </section>
    </form> : <div className=" h-screen flex items-center justify-center"><ClipLoader /></div>}</>
}


export default Set;