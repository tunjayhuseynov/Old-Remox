import Dashboard from './pages/dashboard/index';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useHistory,
  useLocation,
  Redirect
} from 'react-router-dom'
import Pay from './pages/dashboard/pay';
import Home from './pages/home';
import Create from './pages/create';
import { useEffect } from 'react'
import Unlock from './pages/unlock';
import Import from './pages/import/index';
import Assets from './pages/dashboard/assets'
import Teams from './pages/teams/index'
import Main from './pages/dashboard/main'
import Transactions from './pages/transactions/transactions'
import { IStorage, selectStorage } from './redux/reducers/storage';
import { selectUnlock } from './redux/reducers/unlock';
import { useAppSelector } from './redux/hooks';
import Details from './pages/transactions/details';
import MassPay from './pages/dashboard/masspay'
import Initalization from './utility/init'
import { SelectBalances, SelectCurrencies } from './redux/reducers/currencies';
import { ClipLoader } from 'react-spinners';
import { SelectTransactions } from './redux/reducers/transactions';

function App(): JSX.Element {
  const storage = useAppSelector(selectStorage)
  const unlock = useAppSelector(selectUnlock)


  return (
    <div className="App min-h-screen w-full">
      <Switch>
        <Route path="/unlock" exact >
          <Unlock />
        </Route>
        <CustomRouter unlock={unlock} data={storage} />
      </Switch>
    </div>
  );
}

const CustomRouter = ({ unlock, data }: { unlock: boolean, data: IStorage | null }) => {
  const router = useHistory();
  const location = useLocation();
  const currencies = useAppSelector(SelectCurrencies)
  const transactions = useAppSelector(SelectTransactions)
  const balances = useAppSelector(SelectBalances)

  useEffect(() => {
    if (router && data && unlock && location && location.pathname === '/') router.push('/dashboard')
  }, [unlock, router, data, location])

  const unlockChecking = (element: JSX.Element | Array<JSX.Element>) => {

    if (!location.pathname.includes("/dashboard") && !data?.accountAddress) return element
    if (unlock) {
      if (currencies.CELO === undefined && balances.CELO === undefined && transactions === undefined) {
        return <div className={'h-full flex items-center justify-center'}>
          <ClipLoader />
        </div>
      }
      return element
    }

    return <Redirect
      to={{
        pathname: "/unlock",
        state: { from: location }
      }}
    />
  }

  return <>
    <Route path="/" exact render={() => unlockChecking(<Home />)} />
    <Route path="/create" exact render={() => unlockChecking(<Create />)} />
    <Route path="/import" exact render={() => unlockChecking(<Import />)} />
    <AuthRouter data={data} unlockChecking={unlockChecking} />
  </>
}


const AuthRouter = ({ data, unlockChecking }: { data: IStorage | null, unlockChecking: Function }) => {
  const router = useHistory();
  const currencies = useAppSelector(SelectCurrencies)
  const balances = useAppSelector(SelectBalances)

  useEffect(() => {
    if (!data) {
      router.push('/')
      return
    }

    if ((data && data.accountAddress && data.token) && (currencies.CELO === undefined || balances.CELO === undefined)) {
      Initalization()
    }

  }, [data, router])

  return <>

    <Route path={'/masspayout'} exact render={() => unlockChecking(<MassPay />)} />
    <Route path={'/pay'} exact render={() => unlockChecking(<Pay />)} />
    <Route path={'/dashboard'} render={({ match: { path } }) => {
      return <Dashboard>
        <Switch>
          <Route path={path + '/'} exact render={() => unlockChecking(<Main />)} />
          <Route path={path + '/assets'} exact render={() => unlockChecking(<Assets />)} />
          <Route path={path + '/teams'} exact render={() => unlockChecking(<Teams />)} />
          <Route path={path + '/transactions'} exact render={() => unlockChecking(<Transactions />)} />
          <Route path={path + '/transactions/:id'} exact render={() => unlockChecking(<Details />)} />
        </Switch>
      </Dashboard>
    }} >

    </Route>
  </>
}

export default App;
