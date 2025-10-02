export interface CreditCardData {
    cardNumber: string;
    cardHolderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
}
export interface PixData {
    amount: number;
    description: string;
    customerEmail: string;
}
export interface PaymentGatewayResponse {
    success: boolean;
    transactionId: string;
    status: 'APPROVED' | 'DECLINED' | 'PROCESSING' | 'PENDING';
    message: string;
    gatewayTransactionId?: string;
    pixCode?: string;
    qrCodeImage?: string;
    expiresAt?: Date;
    details?: any;
}
declare class PaymentGatewayService {
    private readonly TEST_CARDS;
    processCreditCard(data: CreditCardData, amount: number): Promise<PaymentGatewayResponse>;
    processPixPayment(data: PixData): Promise<PaymentGatewayResponse>;
    checkPixStatus(gatewayTransactionId: string): Promise<PaymentGatewayResponse>;
    private generatePixCode;
    private generateQRCode;
    private generateTransactionId;
    private generateAuthCode;
    private generatePixKey;
    private getCardBrand;
    private simulateDelay;
    private simulateRandomResult;
    tokenizeCard(cardData: CreditCardData): Promise<string>;
    getTestCards(): {
        [key: string]: any;
    };
}
export declare const paymentGatewayService: PaymentGatewayService;
export {};
//# sourceMappingURL=paymentGateway.service.d.ts.map