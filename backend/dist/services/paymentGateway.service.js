"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentGatewayService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
class PaymentGatewayService {
    constructor() {
        this.TEST_CARDS = {
            '4111111111111111': { status: 'APPROVED', message: 'Transaction approved' },
            '5555555555554444': { status: 'APPROVED', message: 'Transaction approved' },
            '4000000000000119': { status: 'DECLINED', message: 'Insufficient funds' },
            '4000000000000127': { status: 'DECLINED', message: 'Invalid CVV' },
            '4000000000000069': { status: 'DECLINED', message: 'Card expired' },
            '4000000000000002': { status: 'DECLINED', message: 'Card declined' },
            '4000000000000259': { status: 'PROCESSING', message: 'Transaction being processed' }
        };
    }
    async processCreditCard(data, amount) {
        await this.simulateDelay(1000, 3000);
        const gatewayTransactionId = this.generateTransactionId();
        const testResult = this.TEST_CARDS[data.cardNumber];
        if (!testResult) {
            const isApproved = this.simulateRandomResult(0.85);
            return {
                success: isApproved,
                transactionId: gatewayTransactionId,
                status: isApproved ? 'APPROVED' : 'DECLINED',
                message: isApproved ? 'Transaction approved' : 'Transaction declined by issuer',
                gatewayTransactionId,
                details: {
                    authCode: isApproved ? this.generateAuthCode() : undefined,
                    cardBrand: this.getCardBrand(data.cardNumber),
                    lastFourDigits: data.cardNumber.slice(-4),
                    processingTime: Date.now()
                }
            };
        }
        const mappedStatus = testResult.status;
        return {
            success: mappedStatus === 'APPROVED',
            transactionId: gatewayTransactionId,
            status: mappedStatus,
            message: testResult.message,
            gatewayTransactionId,
            details: {
                authCode: testResult.status === 'APPROVED' ? this.generateAuthCode() : undefined,
                cardBrand: this.getCardBrand(data.cardNumber),
                lastFourDigits: data.cardNumber.slice(-4),
                isTestCard: true,
                processingTime: Date.now()
            }
        };
    }
    async processPixPayment(data) {
        await this.simulateDelay(500, 1500);
        const gatewayTransactionId = this.generateTransactionId();
        const pixCode = this.generatePixCode(data.amount, data.description);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        try {
            const qrCodeImage = await this.generateQRCode(pixCode);
            return {
                success: true,
                transactionId: gatewayTransactionId,
                status: 'PENDING',
                message: 'PIX payment created successfully. Awaiting payment.',
                gatewayTransactionId,
                pixCode,
                qrCodeImage,
                expiresAt,
                details: {
                    pixKey: this.generatePixKey(),
                    bankName: 'Banco Mock',
                    recipientName: 'Sistema de Pagamentos LTDA',
                    description: data.description,
                    processingTime: Date.now()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                transactionId: gatewayTransactionId,
                status: 'DECLINED',
                message: 'Failed to generate PIX payment',
                details: {
                    error: 'QR_CODE_GENERATION_FAILED'
                }
            };
        }
    }
    async checkPixStatus(gatewayTransactionId) {
        await this.simulateDelay(200, 800);
        const lastDigit = parseInt(gatewayTransactionId.slice(-1));
        let status;
        let message;
        if (lastDigit <= 6) {
            status = 'APPROVED';
            message = 'PIX payment confirmed';
        }
        else if (lastDigit <= 8) {
            status = 'PENDING';
            message = 'PIX payment still pending';
        }
        else {
            status = 'DECLINED';
            message = 'PIX payment expired';
        }
        return {
            success: status === 'APPROVED',
            transactionId: gatewayTransactionId,
            status,
            message,
            gatewayTransactionId,
            details: {
                paidAt: status === 'APPROVED' ? new Date() : undefined,
                payerBank: status === 'APPROVED' ? 'Banco do Cliente' : undefined,
                payerAccount: status === 'APPROVED' ? '****1234' : undefined,
                processingTime: Date.now()
            }
        };
    }
    generatePixCode(amount, description) {
        const pixKey = this.generatePixKey();
        const merchantName = 'Sistema de Pagamentos';
        const merchantCity = 'SAO PAULO';
        const currency = '986';
        const pixData = {
            pixKey,
            merchantName,
            merchantCity,
            amount: amount.toFixed(2),
            currency,
            description: description.substring(0, 25)
        };
        return `00020126${pixKey.length.toString().padStart(2, '0')}${pixKey}${merchantName.length.toString().padStart(2, '0')}${merchantName}5303${currency}54${pixData.amount.length.toString().padStart(2, '0')}${pixData.amount}5802BR59${merchantName.length.toString().padStart(2, '0')}${merchantName}60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}62${description.length.toString().padStart(2, '0')}${description}6304`;
    }
    async generateQRCode(pixCode) {
        try {
            const qrCodeDataUrl = await qrcode_1.default.toDataURL(pixCode, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return qrCodeDataUrl;
        }
        catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }
    generateTransactionId() {
        return `txn_${crypto_1.default.randomBytes(16).toString('hex')}`;
    }
    generateAuthCode() {
        return crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    }
    generatePixKey() {
        return `pagamentos+${crypto_1.default.randomBytes(4).toString('hex')}@sistemapagamentos.com`;
    }
    getCardBrand(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        if (/^4/.test(cleaned))
            return 'visa';
        if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned))
            return 'mastercard';
        if (/^3[47]/.test(cleaned))
            return 'amex';
        if (/^(4011|4312|4389|4514|4573|6277|6362|6363|6504|6505|6516|6550)/.test(cleaned))
            return 'elo';
        return 'unknown';
    }
    async simulateDelay(minMs, maxMs) {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    simulateRandomResult(successRate) {
        return Math.random() < successRate;
    }
    async tokenizeCard(cardData) {
        const cardInfo = `${cardData.cardNumber}:${cardData.expirationMonth}:${cardData.expirationYear}`;
        const hash = crypto_1.default.createHash('sha256').update(cardInfo).digest('hex');
        return `tok_${hash.substring(0, 32)}`;
    }
    getTestCards() {
        return {
            approved: [
                { number: '4111111111111111', brand: 'visa', description: 'Visa - Always approved' },
                { number: '5555555555554444', brand: 'mastercard', description: 'Mastercard - Always approved' },
                { number: '4000000000000002', brand: 'visa', description: 'Visa - Always approved' }
            ],
            declined: [
                { number: '4000000000000119', brand: 'visa', description: 'Visa - Insufficient funds' },
                { number: '4000000000000127', brand: 'visa', description: 'Visa - Invalid CVV' },
                { number: '4000000000000069', brand: 'visa', description: 'Visa - Expired card' },
                { number: '4000000000000002', brand: 'visa', description: 'Visa - Generic decline' }
            ],
            processing: [
                { number: '4000000000000259', brand: 'visa', description: 'Visa - Processing (async)' }
            ]
        };
    }
}
exports.paymentGatewayService = new PaymentGatewayService();
//# sourceMappingURL=paymentGateway.service.js.map