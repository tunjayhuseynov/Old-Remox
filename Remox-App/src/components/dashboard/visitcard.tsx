import { AddressReducer } from "../../utility";
import { useState } from "react";
import { usePopperTooltip } from 'react-popper-tooltip';
import 'react-popper-tooltip/dist/styles.css';


const Visitcard = ({ name, address }: { name: string, address: string }) => {

    const [tooltip, setTooltip] = useState(false);

    const {
        getArrowProps,
        getTooltipProps,
        setTooltipRef,
        setTriggerRef,
        visible
    } = usePopperTooltip();

    return <>
        <div ref={setTriggerRef} className="px-5 py-1 flex flex-col bg-gray-50 rounded-xl cursor-pointer" onClick={() => {
            navigator.clipboard.writeText(address.trim())
            setTooltip(true)
            setTimeout(()=>{
                setTooltip(false)
            },300)
        }}>
            <h3 className="text-lg">{name}</h3>
            <p className="text-xs" >{AddressReducer(address)}</p>
        </div>
        {tooltip && (
            <div
                ref={setTooltipRef}
                {...getTooltipProps({ className: '!rounded-sm tooltip-container' })}
            >
                <div {...getArrowProps({ className: 'tooltip-arrow ' })} />
                <div className="text-sm -m-2 px-2 py-1 rounded-xl">
                    Copied!
                </div>
            </div>
        )}
    </>
}

export default Visitcard;