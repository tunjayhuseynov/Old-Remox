export enum TransactionType {
    PaySomeone,
    MassPayout,
    QuickTransfer,
    IncomingPayment
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