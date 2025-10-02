import crypto from 'crypto';
import QRCode from 'qrcode';

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

class PaymentGatewayService {
  private readonly TEST_CARDS = {
    // Approved cards
  '4111111111111111': { status: 'APPROVED', message: 'Transaction approved' },
  '5555555555554444': { status: 'APPROVED', message: 'Transaction approved' },
  // This test number will be treated as declined below to avoid duplicate key
    
    // Declined cards
    '4000000000000119': { status: 'DECLINED', message: 'Insufficient funds' },
    '4000000000000127': { status: 'DECLINED', message: 'Invalid CVV' },
    '4000000000000069': { status: 'DECLINED', message: 'Card expired' },
  '4000000000000002': { status: 'DECLINED', message: 'Card declined' },
    
    // Processing cards (for testing async flow)
    '4000000000000259': { status: 'PROCESSING', message: 'Transaction being processed' }
  };

  // Process credit card payment
  async processCreditCard(data: CreditCardData, amount: number): Promise<PaymentGatewayResponse> {
    // Simulate network delay
    await this.simulateDelay(1000, 3000);

    const gatewayTransactionId = this.generateTransactionId();
    const testResult = this.TEST_CARDS[data.cardNumber as keyof typeof this.TEST_CARDS];

    // If not a test card, simulate random approval/decline
    if (!testResult) {
      const isApproved = this.simulateRandomResult(0.85); // 85% success rate
      
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

    // Use test card result
    const mappedStatus = testResult.status as 'APPROVED' | 'DECLINED' | 'PROCESSING' | 'PENDING';
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

  // Process PIX payment
  async processPixPayment(data: PixData): Promise<PaymentGatewayResponse> {
    // Simulate network delay
    await this.simulateDelay(500, 1500);

    const gatewayTransactionId = this.generateTransactionId();
    const pixCode = this.generatePixCode(data.amount, data.description);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    try {
      // Generate QR Code
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
    } catch (error) {
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

  // Check PIX payment status (mock - in real scenario this would check with bank)
  async checkPixStatus(gatewayTransactionId: string): Promise<PaymentGatewayResponse> {
    // Simulate network delay
    await this.simulateDelay(200, 800);

    // Simulate different statuses based on transaction ID
    const lastDigit = parseInt(gatewayTransactionId.slice(-1));
    
  let status: 'APPROVED' | 'PENDING' | 'DECLINED';
    let message: string;

    if (lastDigit <= 6) {
      // 70% chance of approval
      status = 'APPROVED';
      message = 'PIX payment confirmed';
    } else if (lastDigit <= 8) {
      // 20% chance of still pending
      status = 'PENDING';
      message = 'PIX payment still pending';
    } else {
      // 10% chance of expiration
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

  // Generate PIX code (simplified version)
  private generatePixCode(amount: number, description: string): string {
    const pixKey = this.generatePixKey();
    const merchantName = 'Sistema de Pagamentos';
    const merchantCity = 'SAO PAULO';
    const currency = '986'; // BRL
    
    // Simplified PIX code generation (in production, use proper EMV format)
    const pixData = {
      pixKey,
      merchantName,
      merchantCity,
      amount: amount.toFixed(2),
      currency,
      description: description.substring(0, 25) // Limit description
    };

    // Generate a mock PIX code
    return `00020126${pixKey.length.toString().padStart(2, '0')}${pixKey}${merchantName.length.toString().padStart(2, '0')}${merchantName}5303${currency}54${pixData.amount.length.toString().padStart(2, '0')}${pixData.amount}5802BR59${merchantName.length.toString().padStart(2, '0')}${merchantName}60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}62${description.length.toString().padStart(2, '0')}${description}6304`;
  }

  // Generate QR Code image
  private async generateQRCode(pixCode: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  // Helper methods
  private generateTransactionId(): string {
    return `txn_${crypto.randomBytes(16).toString('hex')}`;
  }

  private generateAuthCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  private generatePixKey(): string {
    // Generate a mock PIX key (email format)
    return `pagamentos+${crypto.randomBytes(4).toString('hex')}@sistemapagamentos.com`;
  }

  private getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^(4011|4312|4389|4514|4573|6277|6362|6363|6504|6505|6516|6550)/.test(cleaned)) return 'elo';
    
    return 'unknown';
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private simulateRandomResult(successRate: number): boolean {
    return Math.random() < successRate;
  }

  // Tokenize credit card (for saving cards)
  async tokenizeCard(cardData: CreditCardData): Promise<string> {
    const cardInfo = `${cardData.cardNumber}:${cardData.expirationMonth}:${cardData.expirationYear}`;
    const hash = crypto.createHash('sha256').update(cardInfo).digest('hex');
    return `tok_${hash.substring(0, 32)}`;
  }

  // Get test credit card numbers for documentation
  getTestCards(): { [key: string]: any } {
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

export const paymentGatewayService = new PaymentGatewayService();