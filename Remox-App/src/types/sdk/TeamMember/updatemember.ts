import { CoinsName } from "../../coins";
import { Interval } from "./addMember";

export interface UpdateMember {
    id: string,
    name: string,
    address: string,
    currency: CoinsName,
    amount: string,
    teamId: string, 
    paymantDate: string,
    interval: Interval,
    usdBase: boolean,
    secondaryCurrency?: CoinsName,
    secondaryAmount?: string,
    secondaryUsdBase?: boolean,
}

export interface UpdateMemberResponse {
    id: string,
    name: string,
    address: string,
    currency: CoinsName,
    amount: string,
    teamId: string, 
    paymantDate: string,
    interval: Interval,
    usdBase: boolean,
    secondaryCurrency?: CoinsName,
    secondaryAmount?: string,
    secondaryUsdBase?: boolean,
}