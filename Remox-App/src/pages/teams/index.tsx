import { Fragment, useEffect, useState, useRef } from 'react';
import TeamContainer from '../../components/teams/teamContainer'
import Modal from '../../components/modal'
import AddTeams from '../../components/teams/buttons/addTeam'
import AddMember from '../../components/teams/buttons/addMember'
import { ClipLoader } from 'react-spinners';
import { TeamInfoWithMembers } from '../../types/sdk/Team/GetTeamsWithMembers';
import { generate } from 'shortid';
import Success from '../../components/success';
import { useAppSelector, useAppDispatch } from '../../redux/hooks'
import { changeError, changeSuccess, selectError, selectSuccess } from '../../redux/reducers/notificationSlice'
import Error from '../../components/error';
import { useLazyGetTeamsWithMembersQuery } from '../../redux/api';
import { result } from 'lodash';


const Teams = () => {

    const [teamCount] = useState(3)
    const [skipCount, setSkipCount] = useState(0)
    const skipRef = useRef(0)

    const [trigger, result] = useLazyGetTeamsWithMembersQuery();


    const isSuccess = useAppSelector(selectSuccess)
    const isError = useAppSelector(selectError)
    const dispatch = useAppDispatch()

    const [addTeamModal, setAddTeamModal] = useState(false)
    const [addMemberModal, setAddMemberModal] = useState(false)

    const [teams, setTeams] = useState<TeamInfoWithMembers[]>([])

    const maxTeamCount = useRef(0)

    useEffect(() => {
        if (result.data) {
            maxTeamCount.current = result.data.total;
            if (skipRef.current !== 0) {
                setTeams([...teams, ...result.data.teams])
            } else {
                setTeams(result.data.teams)
            }
            dispatch(changeSuccess(false))
        }
    }, [result.data])

    useEffect(() => {
            skipRef.current = skipCount
            trigger({ take: teamCount, skip: skipCount })
    }, [skipCount])


    useEffect(() => {
        if (!isSuccess && result.data) {
            //refetch()
            skipRef.current = 0;
            trigger({ take: teams.length < teamCount ? teamCount : teams.length, skip: skipRef.current })
        }
    }, [isSuccess])

    return <div>
        <div className="flex sm:justify-between pb-5 space-x-3 md:space-x-0">
            <div className="grid grid-cols-2 md:grid-cols-3 sm:gap-10 gap-1 col-span-4">
                <button className="bg-primary px-6 py-2 rounded-xl text-white text-xs sm:text-base" onClick={() => setAddTeamModal(true)}>Add Team</button>
                <button className="bg-primary px-6 py-2 rounded-xl text-white text-xs sm:text-base" onClick={() => setAddMemberModal(true)}>Add Person</button>
            </div>
            <button className="px-5 py-2 bg-greylish bg-opacity-5 rounded-xl">
                Export
            </button>
        </div>
        <div className="w-full shadow-custom px-5 pt-4 pb-6 rounded-xl">
            <div id="header" className="hidden sm:grid grid-cols-[30%,30%,1fr] lg:grid-cols-[20%,20%,20%,1fr] border-b border-black sm:pb-5 px-5" >
                <div className="font-normal">Name</div>
                <div className="font-normal hidden lg:block">Team</div>
                <div className="font-normal">Amount</div>
                <div className="font-normal">Wallet Address</div>
            </div>
            <div>
                {teams.map(w => w && w.members && w.members.length > 0 ? <Fragment key={generate()}><TeamContainer {...w} /></Fragment> : undefined)}
                {teams.map(w => w && (!w?.members || w?.members?.length === 0) ? <Fragment key={generate()}><TeamContainer {...w} /></Fragment> : undefined)}

                {(result.isLoading || result.isFetching) && <div className="flex justify-center py-10"><ClipLoader /></div>}
            </div>
        </div>
        {(!result.isLoading && !result.isFetching) && (teams.length ?? 0) < maxTeamCount.current && <div className="flex justify-center py-4">
            <button className="text-primary px-5 py-3 rounded-xl border border-primary" onClick={() => {
                if (maxTeamCount.current - (teams.length ?? 0) < teamCount) {
                    setSkipCount(maxTeamCount.current - (maxTeamCount.current - teams.length))
                } else {
                    setSkipCount(teams.length)
                }
            }}>
                Load More
            </button>
        </div>}
        {addTeamModal &&
            <Modal onDisable={setAddTeamModal}>
                <AddTeams onDisable={setAddTeamModal} />
            </Modal>}
        {addMemberModal &&
            <Modal onDisable={setAddMemberModal}>
                <AddMember onDisable={setAddMemberModal} />
            </Modal>}
        {isSuccess && <Success onClose={(val: boolean) => dispatch(changeSuccess(val))} text="Successfully" />}
        {isError && <Error onClose={(val: boolean) => dispatch(changeError({activate: val}))} />}
    </div>
}

export default Teams;