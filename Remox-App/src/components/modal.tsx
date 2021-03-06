import React, { useEffect } from "react";


const Modal = ({ children, onDisable, title, className, disableX = false }: { children?: JSX.Element | JSX.Element[], onDisable: React.Dispatch<React.SetStateAction<boolean>>, title?: string, className?: string, disableX?: boolean }) => {
    useEffect(() => {
        document.querySelector('body')!.style.overflowY = "hidden"
        return () => {
            document.querySelector('body')!.style.overflowY = ""
        }
    }, [])
    return <>
        <div className="w-full h-full !my-0 bg-white bg-opacity-60 absolute left-0 top-0 z-40" onClick={() => onDisable(false)} style={{
            top: `${window.scrollY}px`,
        }}>
        </div>
        <div className={`absolute ${className} overflow-scroll max-h-[75vh]  left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[90%] sm:w-[60%] lg:w-auto lg:min-w-[33%] shadow-custom rounded-xl z-50`} style={{ top: `${window.scrollY + (window.innerHeight / 2)}px` }}>
            <div className="relative px-5 py-10">
                {children}
                {!(!title) && <div className="absolute right-full top-2 font-bold translate-x-[105%] w-1/2">
                    {title}
                </div>}
                {!disableX && <button onClick={() => onDisable(false)} className="absolute left-full top-0 translate-x-[-200%] translate-y-[25%] text-greylish opacity-45">
                    X
                </button>}
            </div>
        </div>
    </>
}

export default Modal;