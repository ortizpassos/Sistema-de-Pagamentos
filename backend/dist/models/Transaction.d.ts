import mongoose, { Document } from 'mongoose';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'DECLINED' | 'FAILED' | 'EXPIRED';
export type PaymentMethod = 'credit_card' | 'pix';
export interface ICustomer {
    name: string;
    email: string;
    document?: string;
}
export interface ITransaction extends Document {
    _id: string;
    orderId: string;
    userId?: string;
    recipientUserId?: string;
    recipientPixKey?: string;
    amount: number;
    baseAmount?: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: TransactionStatus;
    customer: ICustomer;
    returnUrl: string;
    callbackUrl: string;
    bankTransactionId?: string;
    bankPixId?: string;
    pixCode?: string;
    qrCodeImage?: string;
    expiresAt?: Date;
    savedCardId?: string;
    gatewayResponse?: any;
    installments?: {
        quantity: number;
        interestMonthly: number;
        totalWithInterest: number;
        installmentValue: number;
        mode: 'AVISTA' | 'PARCELADO';
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Transaction.d.ts.map