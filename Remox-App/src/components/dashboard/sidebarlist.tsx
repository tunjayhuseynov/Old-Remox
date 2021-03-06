import { useNavigate, NavLink } from 'react-router-dom'
import { BiLogOut } from 'react-icons/bi'
import { useDispatch } from 'react-redux'
import { removeStorage } from '../../redux/reducers/storage'
import { setMenu } from '../../redux/reducers/toggles'
import { removeTransactions } from '../../redux/reducers/transactions'

const Li = ({ children, onClick, className }: { children?: Array<any>, onClick?: () => void, className?: string }) => <li onClick={onClick} className={`py-2 mb-4 pl-4 text-left font-light text-lg cursor-pointer ${className}`}>
    <div className="flex gap-3">{children}</div>
</li>

const Sidebarlist = () => {
    const dispatch = useDispatch()
    const navigator = useNavigate()
    return <>
        <ul>
            <NavLink to="/dashboard" end={true} className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li className="bg-greylish bg-opacity-10"><DashboardSVG active={isActive} />Dashboard</Li>}</NavLink>
            <NavLink to="/dashboard/payroll" className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li><PayrollSVG active={isActive} />Payroll</Li>}</NavLink>
            <NavLink to="/dashboard/transactions" className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li><TransactionsSVG active={isActive} />Transactions</Li>}</NavLink>
            <NavLink to="/dashboard/swap" className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li><SwapSVG active={isActive} />Swap</Li>}</NavLink>
            <NavLink to="/dashboard/assets" className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li><AssetsSVG active={isActive} />Assets</Li>}</NavLink>
            <NavLink to="/dashboard/teams" className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li><TeamsSVG active={isActive} />Contributors</Li>}</NavLink>
            <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'text-primary' : ''}>{({ isActive }) => <Li><SettingSVG active={isActive} />Settings</Li>}</NavLink>
            <Li onClick={() => {
                dispatch(setMenu(false))
                dispatch(removeTransactions())
                dispatch(removeStorage())
                navigator('/')
            }}><LogoutSVG />Log Out</Li>
        </ul>
    </>
}

const DashboardSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? '/icons/sidebar/dashboard_active.png' : '/icons/sidebar/dashboard.png'} alt='Dashboard' />

const PayrollSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? '/icons/sidebar/payroll_active.png' : '/icons/sidebar/payroll.png'} alt="Payroll" />

const TransactionsSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? "/icons/sidebar/transaction_active.png" : '/icons/sidebar/transaction.png'} alt="Transaction" />

const SwapSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? '/icons/sidebar/swap_active.png' : '/icons/sidebar/swap.png'} alt="Swap" />

const AssetsSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? '/icons/sidebar/managment_active.png' : '/icons/sidebar/managment.png'} alt="Asset" />

const TeamsSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? '/icons/sidebar/team_active.png' : '/icons/sidebar/team.png'} alt="Teams" />

const SettingSVG = ({ active = false }) => <img className="w-[28px] h-[28px]" src={active ? '/icons/sidebar/settings_active.png' : '/icons/sidebar/settings.png'} alt="" />

const LogoutSVG = ({ active = false }) => <BiLogOut className="w-[28px] h-[28px]" />

export default Sidebarlist;

