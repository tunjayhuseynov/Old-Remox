import { useState } from 'react'
import { ClipLoader } from 'react-spinners';
import Header from '../../layouts/home/header';
import { useSignInMutation } from '../../redux/api/account';
import { IStorage, setStorage } from '../../redux/reducers/storage';
import { useDispatch } from 'react-redux';
import { setUnlock } from '../../redux/reducers/unlock';
import { changeAccount } from '../../redux/reducers/selectedAccount';
import { useNavigate } from 'react-router-dom';
import Button from '../button';

const Login = ({ phrase }: { phrase: string }) => {
    const [signin, { isLoading }] = useSignInMutation()

    const dispatch = useDispatch()

    const [input, setInput] = useState<string>()
    const [incorrrect, setIncorrect] = useState(false)

    const router = useNavigate()

    const Submitted = async () => {
        if (input && phrase) {
            setIncorrect(false)

            try {
                const data = await signin({ phrase: phrase.trim(), password: input.trim() }).unwrap()

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
                console.error(error);
                setIncorrect(true);
            }

        }
    }

    return <>
        <Header />
        <section className="flex flex-col justify-center items-center h-screen gap-8">
            <h2 className="text-3xl text-primary text-center">Open Your Wallet</h2>
            <div className="flex flex-col gap-4 items-center">
                <div className="text-center">Enter your password to open your wallet</div>
                <div className="flex justify-center"><input onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        Submitted()
                    }
                }} onChange={(e) => setInput(e.target.value)} type="password" autoComplete='new-password' className="bg-greylish bg-opacity-10 px-3 py-2 rounded-lg outline-none" /></div>
                {incorrrect && <div className="text-red-600">Password is Incorrect</div>}
                <div className="flex justify-center">
                    <Button onClick={Submitted} className="px-5 py-2" isLoading={isLoading}>Unlock</Button>
                </div>
            </div>
        </section>
    </>
}

export default Login;