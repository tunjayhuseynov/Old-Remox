import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectStorage } from "../redux/reducers/storage";
import Modal from "../components/modal";
import { useState } from "react";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Eth from '@ledgerhq/hw-app-eth'
import { CELO_BASE_DERIVATION_PATH } from '@celo/wallet-ledger'
import Button from "../components/button";


const Home = () => {
    const storage = useSelector(selectStorage)

    const [isModal, setModal] = useState(false)

    return <>
        <section className="flex justify-center items-center w-full h-screen">
            <div className="w-[800px] h-[600px] bg-[#eeeeee] bg-opacity-40 flex flex-col justify-center items-center gap-14">
                <div className="w-[200px] sm:w-[400px] flex flex-col items-center justify-center gap-10">
                    <img src="/logo.png" alt="" className="w-full" />
                    <span className="font-light text-greylish text-center">All-in-One Tool For Crypto Treasury Management</span>
                </div>
                <div className="flex flex-col gap-5">
                    {/*  <button onClick={async () => { //67926

                        const transport = await TransportWebUSB.create()
                        const result = new Eth(transport)
                  
                        console.log(await result.getAddress(`44'/52752'/0'/0/0`))
                        
                        

                    }}>
                        Ledger
                    </button> */}
                    <Link to={storage ? { pathname: '/dashboard' } : { pathname: '/import' }} className="text-center">
                        <Button version="second">Enter App</Button>
                    </Link>
                    <Link to="/create" className="text-center">
                        <Button>Create Account</Button>
                    </Link>
                </div>
            </div>
        </section>
        {isModal &&
            <Modal onDisable={() => setModal(false)} >

            </Modal>}
    </>

};

export default Home;