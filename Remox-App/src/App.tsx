import Dashboard from './pages/dashboard/index';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import Pay from './pages/dashboard/pay';
import Home from './pages/home';
import Create from './pages/create';
import Unlock from './pages/unlock';
import Swap from './pages/swap'
import Import from './pages/import/index';
import OwnerSetting from './pages/settings/owner'
import Assets from './pages/dashboard/assets'
import Teams from './pages/teams/index'
import Main from './pages/dashboard/main'
import Transactions from './pages/transactions/transactions'
import { IStorage, selectStorage } from './redux/reducers/storage';
import { selectUnlock } from './redux/reducers/unlock';
import { useAppSelector } from './redux/hooks';
import Details from './pages/transactions/details';
import MassPay from './pages/dashboard/masspay'
import SettingLayout from './pages/settings';
import MultisigTransaction from './pages/multisig/transaction'
import Payroll from './pages/payroll'
import SpendingSetting from './pages/settings/spending';
import ProfileSetting from './pages/settings/profile';

function App(): JSX.Element {
  const storage = useAppSelector(selectStorage)
  const unlock = useAppSelector(selectUnlock)


  return (
    <div className="App min-h-screen w-full">
      <Routes>
        <Route path="/" element={
          <LockIfUserIn unlock={unlock} storage={storage}>
            <Home />
          </LockIfUserIn>} />
        <Route path="/unlock" element={<Unlock />} />
        <Route path="/create" element={
          <LockIfUserIn unlock={unlock} storage={storage}>
            <Create />
          </LockIfUserIn>} />
        <Route path="/import" element={
          <LockIfUserIn unlock={unlock} storage={storage}>
            <Import />
          </LockIfUserIn>} />
        <Route path={'/masspayout'} element={
          <ProtectUser unlock={unlock} storage={storage}>
            <MassPay />
          </ProtectUser>} />
        <Route path={'/pay'} element={
          <ProtectUser unlock={unlock} storage={storage}>
            <Pay />
          </ProtectUser>} />
        <Route path={'/multisig/:id'} element={
          <ProtectUser unlock={unlock} storage={storage}>
            <MultisigTransaction />
          </ProtectUser>} />
        <Route path={'/dashboard'} element={
          <ProtectUser unlock={unlock} storage={storage}>
            <Dashboard />
          </ProtectUser>} >
          <Route path={''} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Main />
            </ProtectUser>
          } />
          <Route path={'assets'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Assets />
            </ProtectUser>
          } />
          <Route path={'payroll'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Payroll />
            </ProtectUser>
          } />
          <Route path={'teams'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Teams />
            </ProtectUser>
          } />
          <Route path={'transactions'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Transactions />
            </ProtectUser>
          } />
          <Route path={'transactions/:id/:address'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Details />
            </ProtectUser>
          } />
          <Route path={'swap'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <Swap />
            </ProtectUser>
          } />
          <Route path={'settings'} element={
            <ProtectUser unlock={unlock} storage={storage}>
              <SettingLayout />
            </ProtectUser>
          }>
            <Route path={''} element={<OwnerSetting />} />
            <Route path={`spending`} element={<SpendingSetting />} />
            <Route path={`profile`} element={<ProfileSetting />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

const ProtectUser = ({ unlock, storage, children }: { unlock: boolean, storage: IStorage | null, children: JSX.Element }) => {
  if (!unlock && !storage) return <Navigate to={'/'} replace />;
  if (!unlock && storage) return <Navigate to={'/unlock'} replace />;

  return children;
}

const LockIfUserIn = ({ unlock, storage, children }: { unlock: boolean, storage: IStorage | null, children: JSX.Element }) => {
  if (!unlock && storage) return <Navigate to={'/unlock'} replace />;
  if (unlock && storage) return <Navigate to={'/dashboard'} replace />;

  return children;
}

export default App;
