import { useHistory } from 'react-router-dom'
import PhraseBar from '../phraseBar'
import { PassDataFromSetToPhrase } from '../../types/create'
import { useDispatch } from 'react-redux'
import { setStorage } from '../../redux/reducers/storage'
import { setUnlock } from '../../redux/reducers/unlock'

// KeyPhrase Component
const KeyPhrase = ({ data }: { data: PassDataFromSetToPhrase }) => {
    const router = useHistory();
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
                    <span className="text-greylish text-left pb-3">It’s like your username on Remox.<br />You can share this with friends.</span>
                </div>
                <div>
                    <PhraseBar mnemonic={true} address={data?.mnemonic} />
                </div>
            </div>
        </div>
        <div className="flex sm:flex-row flex-col-reverse pb-3 justify-center items-center gap-10 pt-8">
            <button className="rounded-xl w-[150px] h-[50px] border-2 border-primary text-primary shadow-lg bg-white" onClick={() => router.goBack()}>Back</button>
            <button className="rounded-xl w-[150px] h-[50px] text-white shadow-lg bg-primary" onClick={() => {dispatch(setUnlock(true)); dispatch(setStorage(JSON.stringify(data.localSave))); router.push("/dashboard") }}>Continue</button>
        </div>
    </section>
}

export default KeyPhrase;