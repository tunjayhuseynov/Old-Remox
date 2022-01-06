import { useCallback, useEffect, useRef, useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Link } from "react-router-dom";
import { generate } from "shortid";
import useTransactionProcess from "../../hooks/useTransactionProcess";
import { useSetTimeMutation } from "../../redux/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { changeNotificationSeen } from "../../redux/reducers/notificationSlice";
import { RootState } from "../../redux/store";
import { TransactionType } from "../../types";


enum Status {
    OK,
    Reject,
    Pending
}

const NotificationCointainer = () => {
    const list = useTransactionProcess()
    const dispatch = useAppDispatch()
    const seenTime = useAppSelector((state: RootState) => state.notification.notificationSeen)
    const [openNotify, setNotify] = useState(false)
    const [trigger] = useSetTimeMutation()

    const divRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (openNotify) {
            trigger({ time: Date.now().toString() }).unwrap().then(() => {
                dispatch(changeNotificationSeen(Date.now()))
            })
        }
    }, [openNotify])

    const click = useCallback((e) => {
        if (openNotify && divRef.current && !divRef.current.contains(e.target)) {
            setNotify(false)
        }
    }, [openNotify])

    useEffect(() => {
        window.addEventListener('click', click)

        return () => window.removeEventListener('click', click)
    }, [click, divRef])

    return <>
        <IoMdNotificationsOutline className="text-2xl cursor-pointer" onClick={() => setNotify(!openNotify)} />
        {list && new Date(seenTime) < new Date(parseInt((list ? list[0]?.rawDate : "0")) * 1e3) && <div className="absolute w-[10px] h-[10px] bg-primary rounded-full -top-1 -right-1">

        </div>}
        {openNotify &&
            <div ref={divRef} className="translate-x-[75%] sm:translate-x-0 z-40 absolute shadow-custom min-w-[325px] min-h-[200px] right-0 bg-white mt-7 rounded-xl">
                <div className="flex flex-col min-h-[325px] sm:min-h-[auto] justify-center sm:justify-between sm:items-stretch items-center">
                    {list && list.slice(0, 4).map(item =>
                        <NotificationItem key={generate()} status={Status.OK} title={item.type} body={item.amountUSD !== -1 ? `${item.surplus} ${item.amountUSD.toFixed(4)} $`:''} link={`/dashboard/transactions/${item.blockNum}`} />
                    )}
                    {(!list || !list.length) && <div>No notification yet. We'll notify you</div>}
                </div>
            </div>
        }
    </>
}

export default NotificationCointainer;


const NotificationItem = ({ status, title, body, link }: { status: Status, title: TransactionType, body: string, link: string }) => {

    return <div className="grid grid-cols-[15%,65%,20%] min-h-[50px] border-b-2 items-center px-3 py-2">
        <div>
            {
                status === Status.OK && <div className="w-[15px] h-[15px] rounded-full bg-blue-600"></div>
            }
        </div>
        <div className="flex flex-col">
            <div>{title}</div>
            <div>{body}</div>
        </div>
        <Link to={link}>
            <div className={'text-primary'}>
                View
            </div>
        </Link>
    </div>
}