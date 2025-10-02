"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCard = exports.updateCardSchema = exports.saveCardSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const paymentValidation_1 = require("./paymentValidation");
exports.saveCardSchema = joi_1.default.object({
    cardNumber: joi_1.default.string()
        .pattern(new RegExp('^\\d{13,19}$'))
        .required()
        .messages({
        'string.pattern.base': 'Card number must be 13-19 digits',
        'any.required': 'Card number is required'
    }),
    cardHolderName: joi_1.default.string()
        .trim()
        .min(2)
        .max(100)
        .pattern(new RegExp('^[A-Za-z\\s]+$'))
        .required()
        .messages({
        'string.min': 'Card holder name must be at least 2 characters',
        'string.max': 'Card holder name cannot be more than 100 characters',
        'string.pattern.base': 'Card holder name must contain only letters and spaces',
        'any.required': 'Card holder name is required'
    }),
    expirationMonth: joi_1.default.string()
        .pattern(new RegExp('^(0[1-9]|1[0-2])$'))
        .required()
        .messages({
        'string.pattern.base': 'Expiration month must be 01-12',
        'any.required': 'Expiration month is required'
    }),
    expirationYear: joi_1.default.string()
        .pattern(new RegExp('^\\d{4}$'))
        .custom((value, helpers) => {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (year < currentYear || year > currentYear + 20) {
            return helpers.error('any.invalid');
        }
        return value;
    })
        .required()
        .messages({
        'string.pattern.base': 'Expiration year must be 4 digits',
        'any.invalid': 'Expiration year must be valid and not more than 20 years in the future',
        'any.required': 'Expiration year is required'
    }),
    cvv: joi_1.default.string()
        .pattern(new RegExp('^\\d{3,4}$'))
        .required()
        .messages({
        'string.pattern.base': 'CVV must be 3 or 4 digits',
        'any.required': 'CVV is required'
    }),
    isDefault: joi_1.default.boolean()
        .default(false)
        .messages({
        'boolean.base': 'Default flag must be true or false'
    })
});
exports.updateCardSchema = joi_1.default.object({
    cardHolderName: joi_1.default.string()
        .trim()
        .min(2)
        .max(100)
        .pattern(new RegExp('^[A-Za-z\\s]+$'))
        .optional()
        .messages({
        'string.min': 'Card holder name must be at least 2 characters',
        'string.max': 'Card holder name cannot be more than 100 characters',
        'string.pattern.base': 'Card holder name must contain only letters and spaces'
    }),
    isDefault: joi_1.default.boolean()
        .optional()
        .messages({
        'boolean.base': 'Default flag must be true or false'
    })
});
const validateCard = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Card validation failed',
                    code: 'CARD_VALIDATION_ERROR',
                    details: errors
                }
            });
        }
        if (value.cardNumber) {
            if (!(0, paymentValidation_1.validateCreditCardNumber)(value.cardNumber)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid credit card number',
                        code: 'INVALID_CARD_NUMBER'
                    }
                });
            }
            if (!(0, paymentValidation_1.validateCardExpiration)(value.expirationMonth, value.expirationYear)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Card has expired',
                        code: 'CARD_EXPIRED'
                    }
                });
            }
            const brand = (0, paymentValidation_1.getCardBrand)(value.cardNumber);
            if (brand === 'unknown') {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Unsupported card brand',
                        code: 'UNSUPPORTED_CARD_BRAND'
                    }
                });
            }
            value.cardBrand = brand;
        }
        req.body = value;
        next();
    };
};
exports.validateCard = validateCard;
//# sourceMappingURL=cardValidation.js.map