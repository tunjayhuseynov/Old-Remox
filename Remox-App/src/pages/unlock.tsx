import PhraseBar from '../components/phraseBar';
import Header from '../layouts/home/header'
import { useRef, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ClipLoader } from 'react-spinners';
import { selectStorage, setStorage } from '../redux/reducers/storage';
import { useUnlockMutation } from '../redux/api';
import { selectUnlock, setUnlock } from '../redux/reducers/unlock';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import Button from '../components/button';

const Unlock = () => {
    const unlockState = useAppSelector(selectUnlock)
    const storage = useAppSelector(selectStorage)

    const [unlockApp, { isLoading }] = useUnlockMutation()

    const dispatch = useAppDispatch();
    const inputRef = useRef<HTMLInputElement>(null)
    const location = useLocation()
    const router = useNavigate()
    const [incorrrect, setIncorrect] = useState(false)

    useEffect(() => {
        if (!storage) router('/')
    }, [unlockState, location, storage])

    const Submit = async () => {
        if (inputRef.current && storage?.accountAddress) {
            setIncorrect(false);

            try {
                const data = await unlockApp({
                    password: inputRef.current.value.trim(),
                    address: storage.accountAddress
                }).unwrap()

                dispatch(setStorage(JSON.stringify({ ...storage, token: data!.token })))

                dispatch(setUnlock(true))
                router('/dashboard');
            } catch (error) {
                setIncorrect(true);
                console.error(error)
            }
        }
    }

    return <>
        <Header />
        <section className="flex flex-col justify-center items-center h-screen gap-8">
            <h2 className="text-3xl text-primary">Unlock Your Wallet</h2>
            <div className="flex flex-col gap-3">
                <div>Public Address</div>
                {storage && <PhraseBar address={storage.accountAddress} scanIcon={false} />}
            </div>
            <div className="flex flex-col gap-4">
                <div>Enter your password to unlock your wallet</div>
                <div className="flex justify-center"><input onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        Submit()
                    }
                }} ref={inputRef} type="password" autoComplete='new-password' autoFocus className="bg-greylish bg-opacity-10 px-3 py-2 rounded-lg outline-none" /></div>
                {incorrrect && <div className="text-red-600 text-center">Password is Incorrect</div>}
                <div className="flex justify-center">
                    <Button onClick={Submit} className="px-5 py-2" isLoading={isLoading}>Unlock</Button>
                </div>
            </div>
        </section>
    </>
}


export default Unlock;