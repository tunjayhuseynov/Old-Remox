import { useState} from 'react'
import Header from '../layouts/home/header'
import Set from '../components/create/set'
import KeyPhrase from '../components/create/phrase'
import { PassDataFromSetToPhrase } from '../types/create'

const Create = () => {
    const [data, setData] = useState<PassDataFromSetToPhrase>();

    return <div className="h-screen w-full">
        <Header />
        {!data ? <Set setData={setData} /> : <KeyPhrase data={data!} />}
    </div>
}




export default Create;