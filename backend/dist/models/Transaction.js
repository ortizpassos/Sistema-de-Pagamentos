"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CustomerSchema = new mongoose_1.Schema({
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
            validator: function (v) {
                if (!v)
                    return true;
                return /^\d{11}$/.test(v.replace(/\D/g, ''));
            },
            message: 'Document must be a valid CPF (11 digits)'
        }
    }
}, { _id: false });
const TransactionSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
            validator: function (v) {
                try {
                    new URL(v);
                    return true;
                }
                catch {
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
            validator: function (v) {
                try {
                    new URL(v);
                    return true;
                }
                catch {
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
        type: String
    },
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    },
    savedCardId: {
        type: String,
        ref: 'SavedCard'
    },
    gatewayResponse: {
        type: mongoose_1.Schema.Types.Mixed
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
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ recipientUserId: 1 });
TransactionSchema.index({ recipientPixKey: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ paymentMethod: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ bankTransactionId: 1 });
TransactionSchema.index({ bankPixId: 1 });
TransactionSchema.pre('save', function (next) {
    if (this.paymentMethod === 'pix' && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    }
    next();
});
exports.Transaction = mongoose_1.default.model('Transaction', TransactionSchema);
//# sourceMappingURL=Transaction.js.map