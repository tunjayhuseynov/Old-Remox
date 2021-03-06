import { useState } from "react";
import { generate } from "shortid";
import { useDeleteTeamMutation, useUpdateTeamMutation } from "../../redux/api";
import { Member, TeamInfoWithMembers } from "../../types/sdk";
import Modal from "../modal";
import TeamItem from "../payroll/teamItem";


const TeamContainer = (props: TeamInfoWithMembers & { memberState: [Member[], React.Dispatch<React.SetStateAction<Member[]>>] }) => {

    const [num, setNum] = useState(3)

    return <>
        <div className="col-span-4 flex space-x-3 py-4 pt-4 sm:pt-6 pb-1 px-5 items-center justify-start">
            <div>
                <input type="checkbox" className="relative cursor-pointer w-[20px] h-[20px] checked:before:absolute checked:before:w-full checked:before:h-full checked:before:bg-primary checked:before:block" onChange={(e) => {
                    const members = [...props.memberState[0]]
                    if (e.target.checked) {
                        props.members?.forEach(m => {
                            if (!members.some(x => x.id === m.id)) {
                                members.push(m)
                            }
                        })
                        props.memberState[1](members)
                    }else{
                        props.memberState[1](members.filter(m => !props.members?.some(x => x.id === m.id)))
                    }
                }} />
            </div>
            <div className="font-semibold text-[1.5rem] overflow-hidden whitespace-nowrap">
                <div>{props.title}</div>
            </div>
        </div>
        {props.members && props.members.slice(0, num).map(w =>
            <div key={generate()} className="grid grid-cols-2 sm:grid-cols-[30%,30%,1fr] lg:grid-cols-[20%,20%,20%,1fr] py-6 border-b border-black pb-5 px-5 text-sm">
                <TeamItem teamName={props.title} member={w} memberState={props.memberState} />
            </div>
        )}
        {props.members && props.members.length > 3 && num !== 100 ? <button className="py-3 pb-5 px-5 font-bold text-primary" onClick={() => setNum(100)}>
            Show More
        </button> : null}
        {!props.members ? <div className="b-5 px-5 border-b border-black pb-5">No Team Member Yet</div> : undefined}
    </>
}

export default TeamContainer;