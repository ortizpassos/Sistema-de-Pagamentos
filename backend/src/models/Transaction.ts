import mongoose, { Document, Schema } from 'mongoose';

export type TransactionStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'APPROVED' 
  | 'DECLINED' 
  | 'FAILED' 
  | 'EXPIRED';

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
  recipientUserId?: string; // Usuário que irá receber o pagamento (transferência interna)
  recipientPixKey?: string; // Chave PIX do destinatário (email/telefone/aleatória)
  amount: number;
  baseAmount?: number; // Valor original antes de juros (quando parcelado)
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
    interestMonthly: number; // Ex: 0.03 => 3%
    totalWithInterest: number; // Valor final com juros (em mesma unidade de amount)
    installmentValue: number; // Valor de cada parcela arredondado
    mode: 'AVISTA' | 'PARCELADO';
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  document: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\d{11}$/.test(v.replace(/\D/g, ''));
      },
      message: 'Document must be a valid CPF (11 digits)'
    }
  }
}, { _id: false });

const TransactionSchema = new Schema<ITransaction>({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    trim: true,
    maxlength: [50, 'Order ID cannot be more than 50 characters']
  },
  userId: {
    type: String,
    ref: 'User',
    index: true
  },
  recipientUserId: {
    type: String,
    ref: 'User',
    index: true
  },
  recipientPixKey: {
    type: String,
    trim: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    validate: {
      validator: function(v: number) {
        return Number.isFinite(v) && v > 0;
      },
      message: 'Amount must be a valid positive number'
    }
  },
  baseAmount: {
    type: Number,
    min: [0.01, 'Base amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['BRL', 'USD', 'EUR'],
    default: 'BRL',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['credit_card', 'pix']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['PENDING', 'PROCESSING', 'APPROVED', 'DECLINED', 'FAILED', 'EXPIRED'],
    default: 'PENDING'
  },
  customer: {
    type: CustomerSchema,
    required: [true, 'Customer information is required']
  },
  returnUrl: {
    type: String,
    required: [true, 'Return URL is required'],
    validate: {
      validator: function(v: string) {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Return URL must be a valid URL'
    }
  },
  callbackUrl: {
    type: String,
    required: [true, 'Callback URL is required'],
    validate: {
      validator: function(v: string) {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Callback URL must be a valid URL'
    }
  },
  bankTransactionId: {
    type: String,
    trim: true,
    index: true
  },
  bankPixId: {
    type: String,
    trim: true,
    index: true
  },
  pixCode: {
    type: String,
    trim: true
  },
  qrCodeImage: {
    type: String // Base64 encoded image
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  savedCardId: {
    type: String,
    ref: 'SavedCard'
  },
  gatewayResponse: {
    type: Schema.Types.Mixed // Store gateway response for debugging
  },
  installments: {
    quantity: { type: Number },
    interestMonthly: { type: Number },
    totalWithInterest: { type: Number },
    installmentValue: { type: Number },
    mode: { type: String, enum: ['AVISTA', 'PARCELADO'] }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ recipientUserId: 1 });
TransactionSchema.index({ recipientPixKey: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ paymentMethod: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ bankTransactionId: 1 });
TransactionSchema.index({ bankPixId: 1 });

// Auto-expire PIX transactions after 30 minutes
TransactionSchema.pre('save', function(next: any) {
  if (this.paymentMethod === 'pix' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);