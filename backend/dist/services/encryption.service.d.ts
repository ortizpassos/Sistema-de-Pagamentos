declare class EncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private getKey;
    encrypt(text: string): string;
    decrypt(payload: string): string;
    hash(text: string): string;
    generateCardToken(cardNumber: string, expirationMonth: string, expirationYear: string): string;
    maskCardNumber(cardNumber: string): string;
    getLastFourDigits(cardNumber: string): string;
    tokenizeCard(cardData: {
        cardNumber: string;
        cardHolderName: string;
        expirationMonth: string;
        expirationYear: string;
    }): {
        token: string;
        lastFourDigits: string;
        encryptedData: string;
    };
    detokenizeCard(encryptedData: string): {
        cardNumber: string;
        cardHolderName: string;
        expirationMonth: string;
        expirationYear: string;
    };
    static generateEncryptionKey(): string;
    isValidCardToken(token: string): boolean;
    areCardsSame(cardNumber1: string, expMonth1: string, expYear1: string, token2: string): boolean;
}
export declare const encryptionService: EncryptionService;
export {};
//# sourceMappingURL=encryption.service.d.ts.map