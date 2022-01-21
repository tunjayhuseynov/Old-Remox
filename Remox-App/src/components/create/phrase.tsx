import { useNavigate } from 'react-router-dom'
import PhraseBar from '../phraseBar'
import { PassDataFromSetToPhrase } from '../../types/create'
import { useDispatch } from 'react-redux'
import { setStorage } from '../../redux/reducers/storage'
import { setUnlock } from '../../redux/reducers/unlock'
import { changeAccount } from '../../redux/reducers/selectedAccount'
import Button from '../button'

// KeyPhrase Component
const KeyPhrase = ({ data }: { data: PassDataFromSetToPhrase }) => {
    const router = useNavigate();
    const dispatch = useDispatch()
    return <section className="w-full pt-[100px] sm:pt-0 sm:h-screen flex flex-col items-center justify-center">
        <div className="text-primary text-3xl tracking-wide text-center">
            Your New Remox Account
        </div>
        <div className="flex flex-col">
            <div className='grid sm:grid-cols-2 py-14 border-b'>
                <div>
                    <h2 className="text-center sm:text-left">Public Address</h2>
                    <span className="text-greylish text-center sm:text-left pb-3">It’s like your username on Remox.<br />You can share this with friends.</span>
                </div>
                <div>
                    <PhraseBar address={data?.accountAddress} />
                </div>
            </div>
            <div className='grid sm:grid-cols-2 py-14'>
                <div>
                    <h2 className="text-center sm:text-left"> Address</h2>
                    <span className="text-greylish text-left pb-3">It’s like your main password on Remox.<br />Do <strong>Not</strong> Share it with someone.</span>
                </div>
                <div>
                    <PhraseBar mnemonic={true} address={data?.mnemonic} />
                </div>
            </div>
        </div>
        <div className="flex sm:flex-row flex-col-reverse pb-3 justify-center items-center gap-10 pt-8">
            <Button version="second" className="w-[150px] h-[50px]" onClick={() => router(-1)}>Back</Button>
            <Button className="w-[150px] h-[50px]" onClick={() => { dispatch(setUnlock(true)); dispatch(changeAccount(data!.accountAddress)); dispatch(setStorage(JSON.stringify(data.localSave))); router("/dashboard") }}>Continue</Button>
        </div>
    </section>
}

export default KeyPhrase;