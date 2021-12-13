export enum TransactionType {
    PaySomeone = "Pay Someone",
    MassPayout = "Mass Payout",
    QuickTransfer = "Quick Transfer",
    IncomingPayment = "Incoming Payment",
    MassPayment = "Mass Payment",
}

export enum TransactionDirection {
    In,
    Out
}

export enum TransactionStatus{
    Completed, 
    Pending, 
    Rejected
}