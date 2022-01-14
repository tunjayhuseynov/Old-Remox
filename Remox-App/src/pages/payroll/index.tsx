import { Fragment, useEffect, useState, useRef } from 'react';
import TeamContainer from '../../components/payroll/teamContainer'
import { ClipLoader } from 'react-spinners';
import { TeamInfoWithMembers } from '../../types/sdk/Team/GetTeamsWithMembers';
import Success from '../../components/success';
import { useAppSelector, useAppDispatch } from '../../redux/hooks'
import { changeError, changeSuccess, selectError, selectSuccess } from '../../redux/reducers/notificationSlice'
import Error from '../../components/error';
import { useGetTeamsWithMembersQuery, useLazyGetTeamsWithMembersQuery } from '../../redux/api';
import _ from 'lodash';
import { Member } from '../../types/sdk';
import { SelectBalances } from '../../redux/reducers/currencies';
import { Coins } from '../../types';
import {useHistory} from 'react-router-dom'

const Payroll = () => {
    const history = useHistory()

    const result = useGetTeamsWithMembersQuery({ take: 1000 });
    const balance = useAppSelector(SelectBalances)

    const isSuccess = useAppSelector(selectSuccess)
    const isError = useAppSelector(selectError)
    const dispatch = useAppDispatch()


    const [teams, setTeams] = useState<TeamInfoWithMembers[]>([])

    const [totalPrice, setTotalPrice] = useState<{ [name: string]: number }>()

    const memberState = useState<Member[]>([])

    useEffect(() => {
        result.refetch()
    },[])

    useEffect(() => {
        if (result.data) {
            setTeams(result.data.teams)
            const list: Member[] = [];
            result.data.teams.forEach(team => {
                team.members?.forEach(member => {
                    list.push(member)
                })
            })
            const first = Object.entries(_(list).groupBy('currency').value()).map(([currency, members]) => {
                let totalAmount = members.reduce((acc, curr) => {
                    if (new Date(curr.paymantDate).getMonth() !== new Date().getMonth()) {
                        return acc;
                    }
                    let amount = parseFloat(curr.amount)

                    if (curr.usdBase) {
                        amount *= (balance[curr.currency as keyof typeof balance]?.tokenPrice ?? 1)
                    }

                    return acc + amount;
                }, 0)

                return {
                    currency,
                    totalAmount
                }
            })

            const second = Object.entries(_(list).groupBy('secondaryCurrency').value()).filter(s => s[0] !== 'undefined').map(([currency, members]) => {
                let totalAmount = members.reduce((acc, curr) => {
                    if (new Date(curr.paymantDate).getMonth() !== new Date().getMonth()) {
                        return acc;
                    }
                    let amount = (parseFloat(curr!.secondaryAmount!))

                    if (curr.secondaryUsdBase) {
                        amount *= (balance[curr.secondaryCurrency! as keyof typeof balance]?.tokenPrice ?? 1)
                    }

                    return acc + amount

                }, 0)

                return {
                    currency,
                    totalAmount
                }
            })

            let res: any = {}

            first.forEach((item) => {
                if (!res[item.currency]) {
                    res[item.currency] = item.totalAmount
                } else {
                    res[item.currency] += item.totalAmount
                }
            })

            second.forEach((item) => {
                if (!res[item.currency]) {
                    res[item.currency] = item.totalAmount
                } else {
                    res[item.currency] += item.totalAmount
                }
            })

            setTotalPrice(res)
        }
    }, [result.data])


    return <div className="flex flex-col space-y-3">
        <div className="text-2xl font-bold pl-10">
            Payroll
        </div>
        <div className="rounded-xl shadow-custom px-10 pb-10 pt-6">
            <div className='flex flex-col space-y-3'>
                <div className='text-greylish opacity-90'>Total payout per month</div>
                <div className="flex justify-between">
                    <div className='grid grid-cols-2 gap-12'>
                        {totalPrice &&
                            Object.entries(totalPrice).filter(s => s[1]).map(([currency, amount]) => {
                                return <div key={currency} className="flex space-x-2 relative h-fit">
                                    <div className="font-semibold text-xl">{amount.toFixed(2)}</div>
                                    <div className="font-semibold text-xl">{Coins[currency as keyof typeof Coins].name}</div>
                                    <div>
                                        <img src={Coins[currency as keyof typeof Coins].coinUrl} className="w-[25px] h-[25px] rounded-full" alt="" />
                                    </div>
                                    <div className="absolute right-2 -bottom-6 text-sm text-greylish opacity-75 text-right">
                                        {(amount / (balance[Coins[currency as keyof typeof Coins].name as keyof typeof balance]?.tokenPrice ?? 1)).toFixed(2)} USD
                                    </div>
                                </div>
                            })
                        }
                    </div>
                    <div>
                        <button className="bg-primary px-5 py-3 text-white rounded-xl" onClick={()=>{
                            history.push({
                                pathname: '/masspayout',
                                state:{
                                    memberList: memberState[0]
                                }
                            })
                        }}>
                            Run Payroll
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div className="w-full shadow-custom px-5 pt-4 pb-6 rounded-xl">
            <div id="header" className="hidden sm:grid grid-cols-[30%,30%,1fr] lg:grid-cols-[20%,20%,20%,1fr] border-b border-black sm:pb-5 px-5" >
                <div className="font-normal">Name</div>
                <div className="font-normal hidden lg:block">Amount</div>
                <div className="font-normal">Frequency</div>
                <div className="font-normal">Next Payment</div>
            </div>
            <div>
                {teams.map(w => w && w.members && w.members.length > 0 ? <Fragment key={w.id}><TeamContainer {...w} memberState={memberState}/></Fragment> : undefined)}

                {(result.isLoading || result.isFetching) && <div className="flex justify-center py-10"><ClipLoader /></div>}
            </div>
        </div>
        {isSuccess && <Success onClose={(val: boolean) => dispatch(changeSuccess(val))} text="Successfully" />}
        {isError && <Error onClose={(val: boolean) => dispatch(changeError({ activate: val }))} />}
    </div>
}

export default Payroll;