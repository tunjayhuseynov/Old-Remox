import { NavLink, Route, Switch, useRouteMatch } from "react-router-dom";
import OwnerSetting from "./owner";
import SpendingSetting from "./spending";

const SettingLayout = () => {
    const { path } = useRouteMatch();
    return (
        <div>
            <div className="flex w-full relative after:absolute after:w-full after:h-[1px] after:bg-black after:bottom-[1px] after:left-0 after:z-10">
                <NavLink to={path} exact className="mx-5" activeClassName='text-primary border-b-[3px] border-primary z-50'>
                    <div className="flex gap-x-3 pb-3 ">
                        <img src="/icons/ownerSetting.svg" />
                        <span>Owner</span>
                    </div>
                </NavLink>
                {/* <NavLink to={`/dashboard/settings/spending`} className="mx-5" activeClassName='text-primary border-b-[3px] border-primary z-50'>
                    <div className="flex gap-x-3 pb-3">
                        <img src="/icons/spendingSetting.svg" />
                        Spending Limits (soon)
                    </div>
                </NavLink>
                <div className="flex gap-x-3 px-5">
                    <img src="/icons/profileSetting.svg" />
                    Profile
                </div> */}
            </div>
            <div className="px-10 py-5">
                <Switch>
                    <Route path={path} exact>
                        <OwnerSetting />
                    </Route>
                    <Route path={`/dashboard/settings/spending`}>
                        <SpendingSetting />
                    </Route>
                </Switch>
            </div>
        </div>
    )
}

export default SettingLayout;