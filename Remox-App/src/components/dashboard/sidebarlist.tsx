import { Link, NavLink } from 'react-router-dom'

const Li = ({ children }: { children?: Array<any> }) => <li className="mb-6 text-left font-light text-lg flex gap-3">{children}</li>
const Sidebarlist = () => {

    return <>
        <ul>
            <NavLink to="/dashboard" exact={true} activeClassName='text-primary'><Li><DashboardSVG />Dashboard</Li></NavLink>
            <Link to="/masspayout"><Li><PayrollSVG />Payroll</Li></Link>
            <NavLink to="/dashboard/transactions" activeClassName='text-primary'><Li><TransactionsSVG />Transactions</Li></NavLink>
            <Li><SwapSVG />Swap</Li>
            <NavLink to="/dashboard/assets" activeClassName='text-primary'><Li><AssetsSVG />Assets</Li></NavLink>
            <NavLink to="/dashboard/teams" activeClassName='text-primary'><Li><TeamsSVG />Teams</Li></NavLink>
            <Li><SettingSVG /> Settings</Li>
        </ul>
    </>
}

const DashboardSVG = () => <img src='/icons/dashboardicon.svg' alt='Dashboard' />

const PayrollSVG = () => <img src='/icons/runpayrollicon.svg' alt="Payroll" />

const TransactionsSVG = () => <img src='/icons/Transactionsicon.svg' alt="Transaction" />

const SwapSVG = () => <img src='/icons/swap.svg' alt="Swap" />

const AssetsSVG = () => <img src='/icons/stocksicon.svg' alt="Asset" />

const TeamsSVG = () => <img src='/icons/teamlogo.svg' alt="Teams" />

const SettingSVG = () => <img src='/icons/settings.svg' alt="" />

export default Sidebarlist;