import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { TransactionDirection, TransactionStatus } from "../../types";



const Accordion = ({ children, date, dataCount, status, direction, grid = "grid-cols-[37%,33%,30%]" }: { children: JSX.Element, date: string, dataCount: number, status: TransactionStatus, direction: TransactionDirection, grid?: string }) => {

    const [isOpen, setOpen] = useState(false)
    const [bodyHeight, setBodyHeight] = useState("0px")

    const click = () => {
        setBodyHeight(bodyHeight === "0px" ? "auto" : "0px")
        setOpen(!isOpen)
    }

    return <div>
        <div className="flex space-x-1 items-center bg-greylish bg-opacity-10 rounded-xl px-3 my-3">
            <div className="cursor-pointer" onClick={click}>
                <IoIosArrowDown className='transition' style={isOpen ? { transform: "rotate(180deg)" } : undefined} />
            </div>
            <div className={`py-3 grid  px-2 ${grid} items-center w-full`}>
                <div>
                    {dataCount === 1 ? "1 Payment" : `${dataCount} Payments`}
                </div>
                <div className="text-sm text-greylish">
                    {TransactionDirection.In === direction ? "Received" : ""} {TransactionDirection.Out === direction ? "Executed" : ""} on {date}
                </div>
                <div className={`flex ${grid !== "grid-cols-[37%,33%,30%]" ? "justify-start" : "justify-end"} gap-x-2 items-center`}>
                    {status === TransactionStatus.Completed ? <div className="bg-green-400 w-2 h-2 rounded-full"></div> : null}
                    {status}
                </div>
                <div></div>
            </div>
        </div>
        <div className="overflow-hidden" style={{
            height: bodyHeight
        }}>
            {children}
        </div>
    </div>
}

export default Accordion;