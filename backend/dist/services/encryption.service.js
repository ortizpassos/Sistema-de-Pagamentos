"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 12;
        this.tagLength = 16;
    }
    getKey() {
        const keyString = process.env.ENCRYPTION_KEY;
        if (!keyString || keyString.length !== this.keyLength) {
            throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
        }
        return Buffer.from(keyString, 'utf8');
    }
    encrypt(text) {
        try {
            const key = this.getKey();
            const iv = crypto_1.default.randomBytes(this.ivLength);
            const cipher = crypto_1.default.createCipheriv(this.algorithm, key, iv);
            const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
            const tag = cipher.getAuthTag();
            return Buffer.concat([iv, tag, encrypted]).toString('base64');
        }
        catch (error) {
            throw new Error('Encryption failed');
        }
    }
    decrypt(payload) {
        try {
            const key = this.getKey();
            const raw = Buffer.from(payload, 'base64');
            const iv = raw.subarray(0, this.ivLength);
            const tag = raw.subarray(this.ivLength, this.ivLength + this.tagLength);
            const ciphertext = raw.subarray(this.ivLength + this.tagLength);
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(tag);
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            return decrypted.toString('utf8');
        }
        catch (error) {
            throw new Error('Decryption failed');
        }
    }
    hash(text) {
        return crypto_1.default.createHash('sha256').update(text).digest('hex');
    }
    generateCardToken(cardNumber, expirationMonth, expirationYear) {
        const cardData = `${cardNumber}:${expirationMonth}:${expirationYear}`;
        const hash = this.hash(cardData);
        return `card_${hash.substring(0, 32)}`;
    }
    maskCardNumber(cardNumber) {
        if (cardNumber.length < 4) {
            return cardNumber;
        }
        const lastFour = cardNumber.slice(-4);
        const masked = '•'.repeat(cardNumber.length - 4);
        return `${masked}${lastFour}`;
    }
    getLastFourDigits(cardNumber) {
        return cardNumber.slice(-4);
    }
    tokenizeCard(cardData) {
        const token = this.generateCardToken(cardData.cardNumber, cardData.expirationMonth, cardData.expirationYear);
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
    detokenizeCard(encryptedData) {
        const decryptedData = this.decrypt(encryptedData);
        const cardData = JSON.parse(decryptedData);
        return {
            cardNumber: cardData.cardNumber,
            cardHolderName: cardData.cardHolderName,
            expirationMonth: cardData.expirationMonth,
            expirationYear: cardData.expirationYear
        };
    }
    static generateEncryptionKey() {
        return crypto_1.default.randomBytes(32).toString('utf8').substring(0, 32);
    }
    isValidCardToken(token) {
        return /^card_[a-f0-9]{32}$/.test(token);
    }
    areCardsSame(cardNumber1, expMonth1, expYear1, token2) {
        const token1 = this.generateCardToken(cardNumber1, expMonth1, expYear1);
        return token1 === token2;
    }
}
exports.encryptionService = new EncryptionService();
//# sourceMappingURL=encryption.service.js.map