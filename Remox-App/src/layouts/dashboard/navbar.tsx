import { IoIosArrowDown, IoMdNotificationsOutline } from 'react-icons/io';
import { BsSearch } from 'react-icons/bs'
import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { Link } from 'react-router-dom';
import ClipLoader from "react-spinners/ClipLoader";
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectStorage } from '../../redux/reducers/storage';
import { Squash as Hamburger } from 'hamburger-react'
import { selectToggle, setMenu } from '../../redux/reducers/toggles';
import NotificationCointainer from '../../components/notification'
import useRefetchData from '../../hooks/useRefetchData';
import { useModalSideExit } from '../../hooks';
import { SelectSelectedAccount } from '../../redux/reducers/selectedAccount';
import { deleteBalance } from '../../redux/reducers/currencies';
import { removeTransactions } from '../../redux/reducers/transactions';
import { AddressReducer } from '../../utility'
import Visitcard from '../../components/dashboard/visitcard';
import Button from '../../components/button';

const Navbar = () => {
    const storage = useAppSelector(selectStorage)
    const menuBar = useAppSelector(selectToggle)
    const dispatch = useAppDispatch()
    const [refetch] = useRefetchData()
    const selectedAccount = useAppSelector(SelectSelectedAccount)

    useEffect(() => {
        dispatch(removeTransactions())
        dispatch(deleteBalance())
        refetch()
    }, [selectedAccount])

    return <div className="grid grid-cols-3 md:grid-cols-5 gap-12">
        <div className="md:hidden pl-4">
            <div className="inline-block" onClick={() => dispatch(setMenu(!menuBar.mobileMenu))}>
                <Hamburger toggled={menuBar.mobileMenu} hideOutline={true} />
            </div>
        </div>
        <div className="h-[50px] flex justify-center md:justify-start items-center md:pl-4 lg:pl-14">
            <img src="/logo.png" alt="" width="150" />
        </div>
        <div className="search col-span-2 hidden md:block">
            <div className="w-full h-12 shadow backdrop-blur bg-gray-50 rounded-lg flex items-center pl-3 gap-3">
                <BsSearch />
                <input type="text" placeholder={'Search'} className="flex-grow bg-transparent outline-none" />
            </div>
        </div>
        <div className="actions hidden md:flex items-center justify-evenly md:col-span-2">
            {storage ? <Visitcard name={selectedAccount !== storage.accountAddress ? 'MultiSig' : "Wallet"} address={selectedAccount} /> : <ClipLoader />}
            <NavbarDropdown />
            <div className="relative">
                <NotificationCointainer />
            </div>
        </div>
    </div>
}



const Li = ({ children, link }: { children: any, link: string }) => <li className="text-left border px-3 py-2 bg-white hover:text-primary hover:border-b-primary cursor-pointer first:rounded-t-xl last:rounded-b-xl"><Link to={link} className='flex gap-2'>{children}</Link></li>

export const NavbarDropdown = () => {
    const [isOpen, setOpen] = useState(false)
    const divRef = useModalSideExit(isOpen, setOpen)


    return <div className="relative">
        <Button onClick={() => setOpen(!isOpen)} className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-x-2">
            <>
                Move Crypto
                <div>
                    <IoIosArrowDown className='transition' style={isOpen ? { transform: "rotate(180deg)" } : undefined} />
                </div>
            </>
        </Button>
        {isOpen && <div ref={divRef} className="absolute w-[150%] rounded-2xl sm:-left-1/4  -bottom-1 translate-y-full shadow-xl z-50">
            <ul>
                <Li link={'/pay'}><PaySVG /> Pay Someone</Li>
                <Li link="/masspayout"><MassPayoutSVG />Mass Payout</Li>
                <Li link=''><RequestMoneySVG /> Request Money</Li>
                <Li link=''><FundSVG /> Add Funds</Li>
            </ul>
        </div>
        }
    </div>
}

const PaySVG = () => <img src='/icons/senticon.svg' alt="" />

const MassPayoutSVG = () => <img src='/icons/masspayouticon.svg' alt="" />

const RequestMoneySVG = () => <img src='/icons/moneyrequesticon.svg' alt="" />

const FundSVG = () => <img src='/icons/addfundds.svg' alt="" />

export default Navbar;