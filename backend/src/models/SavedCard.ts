import mongoose, { Document, Schema } from 'mongoose';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'unknown';

export interface ISavedCard extends Document {
  _id: string;
  userId: string;
  cardToken: string; // Tokenized card number (encrypted)
  encryptedData: string; // Encrypted sensitive card payload
  lastFourDigits: string;
  cardBrand: CardBrand;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedCardSchema = new Schema<ISavedCard>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  cardToken: {
    type: String,
    required: [true, 'Card token is required']
  },
  encryptedData: {
    type: String,
    required: [true, 'Encrypted data is required']
  },
  lastFourDigits: {
    type: String,
    required: [true, 'Last four digits are required'],
    match: [/^\d{4}$/, 'Last four digits must be exactly 4 digits']
  },
  cardBrand: {
    type: String,
    required: [true, 'Card brand is required'],
    enum: ['visa', 'mastercard', 'amex', 'elo', 'unknown']
  },
  cardHolderName: {
    type: String,
    required: [true, 'Card holder name is required'],
    trim: true,
    maxlength: [100, 'Card holder name cannot be more than 100 characters']
  },
  expirationMonth: {
    type: String,
    required: [true, 'Expiration month is required'],
    match: [/^(0[1-9]|1[0-2])$/, 'Expiration month must be 01-12']
  },
  expirationYear: {
    type: String,
    required: [true, 'Expiration year is required'],
    match: [/^\d{4}$/, 'Expiration year must be 4 digits'],
    validate: {
      validator: function(v: string) {
        const year = parseInt(v);
        const currentYear = new Date().getFullYear();
        return year >= currentYear && year <= currentYear + 20;
      },
      message: 'Expiration year must be valid and not more than 20 years in the future'
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.cardToken; // Never expose the token
      delete ret.encryptedData; // Never expose encrypted payload
      return ret;
    }
  }
});

// Indexes
SavedCardSchema.index({ userId: 1 });
SavedCardSchema.index({ userId: 1, isDefault: 1 });
// Ensure uniqueness of a specific card per user (same deterministic token cannot repeat for same user)
SavedCardSchema.index({ userId: 1, cardToken: 1 }, { unique: true });

// Ensure only one default card per user
SavedCardSchema.pre('save', async function(next: any) {
  if (this.isDefault) {
    // Set all other cards for this user to not default
    await mongoose.model('SavedCard').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Validate expiration date
SavedCardSchema.pre('save', function(next: any) {
  const month = parseInt(this.expirationMonth);
  const year = parseInt(this.expirationYear);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    next();
  } else {
    next(new Error('Card has expired'));
  }
});

export const SavedCard = mongoose.model<ISavedCard>('SavedCard', SavedCardSchema);