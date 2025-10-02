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
exports.SavedCard = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SavedCardSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.cardToken;
            delete ret.encryptedData;
            return ret;
        }
    }
});
SavedCardSchema.index({ userId: 1 });
SavedCardSchema.index({ userId: 1, isDefault: 1 });
SavedCardSchema.index({ userId: 1, cardToken: 1 }, { unique: true });
SavedCardSchema.pre('save', async function (next) {
    if (this.isDefault) {
        await mongoose_1.default.model('SavedCard').updateMany({ userId: this.userId, _id: { $ne: this._id } }, { isDefault: false });
    }
    next();
});
SavedCardSchema.pre('save', function (next) {
    const month = parseInt(this.expirationMonth);
    const year = parseInt(this.expirationYear);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        next();
    }
    else {
        next(new Error('Card has expired'));
    }
});
exports.SavedCard = mongoose_1.default.model('SavedCard', SavedCardSchema);
//# sourceMappingURL=SavedCard.js.map