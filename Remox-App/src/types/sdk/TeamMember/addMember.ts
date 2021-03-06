import { CoinsName } from '../../coins'

export enum Interval {
    weakly = "weakly",
    monthly = "monthly",
}

export interface AddMember {
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

export interface AddMemberResponse {
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