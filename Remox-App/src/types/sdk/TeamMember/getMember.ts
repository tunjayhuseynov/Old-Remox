import { CoinsName } from "../../coins";
import { Interval } from "./addMember";

export interface GetMember{
    take?: number;
    skip?: number;
    sortBy?: string;
}

export interface Member {
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

export interface GetMemberResponse{
    members: Member[],
    total: number,
}