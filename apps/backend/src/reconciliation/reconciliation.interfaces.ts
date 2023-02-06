import { CashDepositEntity } from "../deposits/entities/cash-deposit.entity";
import { POSDepositEntity } from "../deposits/entities/pos-deposit.entity";
import { PaymentEntity } from "../transaction/entities";

export interface PosPaymentPosDepositPair {
    payment: PaymentEntity;
    deposit: POSDepositEntity;
}

export interface CashPaymentsCashDepositPair {
    payments: PaymentEntity[];
    deposit: CashDepositEntity;
}