import mongoose, { Document } from 'mongoose';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'unknown';
export interface ISavedCard extends Document {
    _id: string;
    userId: string;
    cardToken: string;
    encryptedData: string;
    lastFourDigits: string;
    cardBrand: CardBrand;
    cardHolderName: string;
    expirationMonth: string;
    expirationYear: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SavedCard: mongoose.Model<ISavedCard, {}, {}, {}, mongoose.Document<unknown, {}, ISavedCard, {}, {}> & ISavedCard & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SavedCard.d.ts.map