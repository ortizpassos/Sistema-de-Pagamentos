import Joi from 'joi';

// Payment Initiation Validation
export const initiatePaymentSchema = Joi.object({
  orderId: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Order ID cannot be empty',
      'string.max': 'Order ID cannot be more than 50 characters',
      'any.required': 'Order ID is required'
    }),
  
  amount: Joi.number()
    .positive()
    .precision(2)
    .min(0.01)
    .max(999999.99)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'number.min': 'Amount must be at least 0.01',
      'number.max': 'Amount cannot exceed 999,999.99',
      'any.required': 'Amount is required'
    }),
  
  currency: Joi.string()
    .valid('BRL', 'USD', 'EUR')
    .default('BRL')
    .messages({
      'any.only': 'Currency must be BRL, USD, or EUR'
    }),
  
  paymentMethod: Joi.string()
    .valid('credit_card', 'pix')
    .required()
    .messages({
      'any.only': 'Payment method must be credit_card or pix',
      'any.required': 'Payment method is required'
    }),
  
  customer: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Customer name must be at least 2 characters',
        'string.max': 'Customer name cannot be more than 100 characters',
        'any.required': 'Customer name is required'
      }),
    
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please enter a valid customer email',
        'any.required': 'Customer email is required'
      }),
    
    document: Joi.string()
      .pattern(new RegExp('^\\d{11}$'))
      .optional()
      .messages({
        'string.pattern.base': 'Customer document must be a valid CPF (11 digits)'
      })
  }).required(),
  
  returnUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Return URL must be a valid URL',
      'any.required': 'Return URL is required'
    }),
  
  callbackUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Callback URL must be a valid URL',
      'any.required': 'Callback URL is required'
    })
});

// Credit Card Payment Validation
export const creditCardPaymentSchema = Joi.object({
  transactionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Transaction ID is required'
    }),
  
  cardNumber: Joi.string()
    .pattern(new RegExp('^\\d{13,19}$'))
    .required()
    .messages({
      'string.pattern.base': 'Card number must be 13-19 digits',
      'any.required': 'Card number is required'
    }),
  
  cardHolderName: Joi.string()
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
  
  expirationMonth: Joi.string()
    .pattern(new RegExp('^(0[1-9]|1[0-2])$'))
    .required()
    .messages({
      'string.pattern.base': 'Expiration month must be 01-12',
      'any.required': 'Expiration month is required'
    }),
  
  expirationYear: Joi.string()
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
  
  cvv: Joi.string()
    .pattern(new RegExp('^\\d{3,4}$'))
    .required()
    .messages({
      'string.pattern.base': 'CVV must be 3 or 4 digits',
      'any.required': 'CVV is required'
    }),

  saveCard: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Save card must be true or false'
    })
});

// PIX Payment Validation
export const pixPaymentSchema = Joi.object({
  transactionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Transaction ID is required'
    })
});

// Get Transaction Validation
export const getTransactionSchema = Joi.object({
  transactionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Transaction ID is required'
    })
});

// PIX Status Check Validation
export const pixStatusSchema = Joi.object({
  transactionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Transaction ID is required'
    })
});

// Custom validation for card expiration date
export const validateCardExpiration = (month: string, year: string): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear();

  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);

  if (expYear > currentYear) {
    return true;
  }

  if (expYear === currentYear) {
    return expMonth >= currentMonth;
  }

  return false;
};

// Luhn algorithm validation for credit card numbers
export const validateCreditCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

// Get card brand from number
export const getCardBrand = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Visa
  if (/^4/.test(cleaned)) {
    return 'visa';
  }
  
  // Mastercard
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
    return 'mastercard';
  }
  
  // American Express
  if (/^3[47]/.test(cleaned)) {
    return 'amex';
  }
  
  // Elo
  if (/^(4011|4312|4389|4514|4573|6277|6362|6363|6504|6505|6516|6550)/.test(cleaned)) {
    return 'elo';
  }
  
  return 'unknown';
};

// Validate payment method against card
export const validatePaymentMethodCard = (paymentMethod: string, cardNumber: string): boolean => {
  if (paymentMethod !== 'credit_card') {
    return true; // Not validating non-card payments here
  }

  const brand = getCardBrand(cardNumber);
  return brand !== 'unknown';
};

// Enhanced validation middleware for payments
export const validatePayment = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: 'Payment validation failed',
          code: 'PAYMENT_VALIDATION_ERROR',
          details: errors
        }
      });
    }

    // Additional credit card validations
    if (value.cardNumber) {
      // Validate card number with Luhn algorithm
      if (!validateCreditCardNumber(value.cardNumber)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid credit card number',
            code: 'INVALID_CARD_NUMBER'
          }
        });
      }

      // Validate expiration date
      if (!validateCardExpiration(value.expirationMonth, value.expirationYear)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Card has expired',
            code: 'CARD_EXPIRED'
          }
        });
      }

      // Validate card brand
      const brand = getCardBrand(value.cardNumber);
      if (brand === 'unknown') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Unsupported card brand',
            code: 'UNSUPPORTED_CARD_BRAND'
          }
        });
      }
    }

    req.body = value;
    next();
  };
};