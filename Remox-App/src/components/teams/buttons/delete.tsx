import { Dispatch, useState } from "react";
import { ClipLoader } from "react-spinners";

import { changeSuccess } from "../../../redux/reducers/notificationSlice";
import { useAppDispatch } from "../../../redux/hooks";
import Button from "../../button";

const Delete = ({ name, onCurrentModal, onDelete, onSuccess }: { name: string, onCurrentModal: Dispatch<boolean>, onDelete: () => Promise<void>, onSuccess?: Dispatch<boolean> }) => {
    const [loading, setLoading] = useState(false)
    const dispatch = useAppDispatch()
    return <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-center text-xl">
            Delete {name}?
        </div>
        <div className="flex justify-center items-center space-x-4">
            <Button version="second" className="border-2 border-red-500 hover:bg-red-500 text-red-500 w-[80px] h-[27px] px-1 py-0" onClick={() => onCurrentModal(false)}>Close</Button>
            <Button className="bg-red-500 hover:bg-red-500 hover:text-white border-red-500 text-white w-[80px] h-[27px] px-1 py-0" onClick={async () => {
                setLoading(true);
                try {
                    await onDelete()
                    //onSuccess(true)
                    dispatch(changeSuccess({activate: true, text: "Successfully"}))
                    onCurrentModal(false)
                } catch (error) {
                    console.error(error)
                }
                setLoading(false)
            }}>{loading ? <ClipLoader size={20} /> : 'Delete'}</Button>
        </div>
    </div>
}

export default Delete;