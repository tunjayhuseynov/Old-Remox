import { Link, NavLink } from 'react-router-dom'
import { BiLogOut } from 'react-icons/bi'
import { useDispatch } from 'react-redux'
import { removeStorage } from '../../redux/reducers/storage'
import { setMenu } from '../../redux/reducers/toggles'

const Li = ({ children, onClick, className }: { children?: Array<any>, onClick?: () => void, className?: string }) => <li onClick={onClick} className={`mb-6 text-left font-light text-lg flex gap-3 cursor-pointer ${className}`}>{children}</li>
const Sidebarlist = () => {
    const dispatch = useDispatch()
    return <>
        <ul>
            <NavLink to="/dashboard" exact={true} activeClassName='text-primary'><Li><DashboardSVG />Dashboard</Li></NavLink>
            <Link to="/masspayout"><Li><PayrollSVG />Payroll</Li></Link>
            <NavLink to="/dashboard/transactions" activeClassName='text-primary'><Li><TransactionsSVG />Transactions</Li></NavLink>
            <Li ><SwapSVG /><div className="relative after:right-0 after:translate-x-[110%] after:translate-y-1/2 after:top-0 after:text-xs after:text-greylish after:content-['Soon'] after:w-10 after:h-5 after:absolute">Swap</div></Li>
            <NavLink to="/dashboard/assets" activeClassName='text-primary'><Li><AssetsSVG />Assets</Li></NavLink>
            <NavLink to="/dashboard/teams" activeClassName='text-primary'><Li><TeamsSVG />Teams</Li></NavLink>
            <Li><SettingSVG /> <div className="relative after:right-0 after:translate-x-[110%] after:translate-y-1/2 after:top-0 after:text-xs after:text-greylish after:content-['Soon'] after:w-10 after:h-5 after:absolute">Settings</div></Li>
            <Li onClick={() => {
                dispatch(setMenu(false))
                dispatch(removeStorage())
            }}><LogoutSVG />Log Out</Li>
        </ul>
    </>
}

const DashboardSVG = () => <img className="w-[28px] h-[28px]" src='/icons/dashboardicon.svg' alt='Dashboard' />

const PayrollSVG = () => <img className="w-[28px] h-[28px]" src='/icons/runpayrollicon.svg' alt="Payroll" />

const TransactionsSVG = () => <img className="w-[28px] h-[28px]" src='/icons/Transactionsicon.svg' alt="Transaction" />

const SwapSVG = () => <img className="w-[28px] h-[28px]" src='/icons/swap.svg' alt="Swap" />

const AssetsSVG = () => <img className="w-[28px] h-[28px]" src='/icons/stocksicon.svg' alt="Asset" />

const TeamsSVG = () => <img className="w-[28px] h-[28px]" src='/icons/teamlogo.svg' alt="Teams" />

const SettingSVG = () => <img className="w-[28px] h-[28px]" src='/icons/settings.svg' alt="" />

const LogoutSVG = () => <BiLogOut className="w-[28px] h-[28px]" />

export default Sidebarlist;