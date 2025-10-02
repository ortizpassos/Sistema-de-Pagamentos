import crypto from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 32 bytes => 256 bits
  private readonly ivLength = 12;  // 96 bits IV recomendado para GCM
  private readonly tagLength = 16; // 128-bit auth tag

  // Get encryption key from environment
  private getKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString || keyString.length !== this.keyLength) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
    return Buffer.from(keyString, 'utf8');
  }

  // Encrypt sensitive data
  encrypt(text: string): string {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      // Estrutura: iv(12 bytes) + tag(16 bytes) + ciphertext
      return Buffer.concat([iv, tag, encrypted]).toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  // Decrypt sensitive data
  decrypt(payload: string): string {
    try {
      const key = this.getKey();
      const raw = Buffer.from(payload, 'base64');
      const iv = raw.subarray(0, this.ivLength);
      const tag = raw.subarray(this.ivLength, this.ivLength + this.tagLength);
      const ciphertext = raw.subarray(this.ivLength + this.tagLength);
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Create a secure hash for indexing (one-way)
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  // Generate a secure token for card identification
  generateCardToken(cardNumber: string, expirationMonth: string, expirationYear: string): string {
    const cardData = `${cardNumber}:${expirationMonth}:${expirationYear}`;
    const hash = this.hash(cardData);
    return `card_${hash.substring(0, 32)}`;
  }

  // Mask card number for display
  maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) {
      return cardNumber;
    }
    const lastFour = cardNumber.slice(-4);
    const masked = '•'.repeat(cardNumber.length - 4);
    return `${masked}${lastFour}`;
  }

  // Get last four digits
  getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
  }

  // Tokenize card data for secure storage
  tokenizeCard(cardData: {
    cardNumber: string;
    cardHolderName: string;
    expirationMonth: string;
    expirationYear: string;
  }): {
    token: string;
    lastFourDigits: string;
    encryptedData: string;
  } {
    // Create secure token for identification
    const token = this.generateCardToken(
      cardData.cardNumber,
      cardData.expirationMonth,
      cardData.expirationYear
    );

    // Encrypt sensitive card data
    const sensitiveData = JSON.stringify({
      cardNumber: cardData.cardNumber,
      cardHolderName: cardData.cardHolderName,
      expirationMonth: cardData.expirationMonth,
      expirationYear: cardData.expirationYear,
      tokenizedAt: new Date().toISOString()
    });

  const encryptedData = this.encrypt(sensitiveData);
  const lastFourDigits = this.getLastFourDigits(cardData.cardNumber);

    return {
      token,
      lastFourDigits,
      encryptedData
    };
  }

  // Detokenize card data (only for payment processing)
  detokenizeCard(encryptedData: string): {
    cardNumber: string;
    cardHolderName: string;
    expirationMonth: string;
    expirationYear: string;
  } {
    const decryptedData = this.decrypt(encryptedData);
    const cardData = JSON.parse(decryptedData);

    return {
      cardNumber: cardData.cardNumber,
      cardHolderName: cardData.cardHolderName,
      expirationMonth: cardData.expirationMonth,
      expirationYear: cardData.expirationYear
    };
  }

  // Generate a secure random key (for initial setup)
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('utf8').substring(0, 32);
  }

  // Validate card token format
  isValidCardToken(token: string): boolean {
    return /^card_[a-f0-9]{32}$/.test(token);
  }

  // Check if two cards are the same (without decrypting)
  areCardsSame(
    cardNumber1: string,
    expMonth1: string,
    expYear1: string,
    token2: string
  ): boolean {
    const token1 = this.generateCardToken(cardNumber1, expMonth1, expYear1);
    return token1 === token2;
  }
}

export const encryptionService = new EncryptionService();