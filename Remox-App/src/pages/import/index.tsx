import { useState } from "react";
import { ClipLoader } from "react-spinners";
import Button from "../../components/button";
import CreatePassword from "../../components/import/createPassword";
import Login from "../../components/import/login";
import { useAccountExistMutation } from "../../redux/api";

const Import = () => {
    const [accountExist, { error: reqError, isLoading }] = useAccountExistMutation()
    const [input, setInput] = useState<string>("")
    const [index, setIndex] = useState(0)
    const [isError, setError] = useState('')

    const Submitted = async () => {
        if (input) {
            try {
                setError('')
                const data = await accountExist({ phrase: input.trim() }).unwrap()
                if (!data!.result) setIndex(1)
                else setIndex(2)
            } catch (error: any) {
                console.error(error)
                setError(error?.data?.message)
            }
        }
    }

    return <>
        {index === 0 && <section className="h-screen flex flex-col items-center justify-center gap-8">
            <div className="text-2xl sm:text-3xl text-primary text-center">Import Your Recovery Phrase</div>
            <div className="text-greylish">
                Enter your recovery (seed) phrase.
                <br />
                Only import on devices you trust.
            </div>
            <div className="flex flex-col gap-5 justify-center items-center">
                <div>
                    <textarea onChange={(e) => setInput(e.target.value)} className="border-2 p-3 outline-none w-[300px] sm:w-[470px]" placeholder="fish boot hand foot" rows={7}></textarea>
                </div>
                {isError && <div className="text-red-500">{isError}</div>}
                <Button onClick={Submitted} className="w-[200px]" isLoading={isLoading}>Import Account</Button>
            </div>
        </section>
        }
        {index === 1 && <CreatePassword phrase={input} />}
        {index === 2 && <Login phrase={input} />}
    </>
}

export default Import;