import 'dotenv/config';

const toNumber = (v: string | undefined, def: number): number => {
  if (!v) return def;
  const n = Number(v);
  return Number.isNaN(n) ? def : n;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: toNumber(process.env.PORT, 3000),

  // Append database name if not provided (avoid trailing slashes duplication)
  mongoUri: (() => {
    const base = (process.env.MONGODB_URI || '').replace(/\/$/, '');
    // If already contains a db name after last slash and not just the host root, keep as is
    if (/\/[a-zA-Z0-9_-]+(\?|$)/.test(base)) return base; // simplistic check
    return base ? `${base}/sistema_pagamentos` : '';
  })(),

  jwt: {
    accessSecret: process.env.JWT_SECRET || 'change_me_access',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
    accessExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  encryptionKey: process.env.ENCRYPTION_KEY || '',
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100)
  },

  pixExpirationMinutes: toNumber(process.env.PIX_EXPIRATION_MINUTES, 30),

  frontendUrls: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),

  email: {
    host: process.env.SMTP_HOST,
    port: toNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM
  },

  features: {
    autoLoginAfterRegister: process.env.AUTO_LOGIN_AFTER_REGISTER === 'true',
    passwordlessRegister: process.env.PASSWORDLESS_REGISTER === 'true'
  },

  logLevel: process.env.LOG_LEVEL || 'info'
  ,
  externalCardValidation: {
    url: process.env.EXTERNAL_CARD_VALIDATION_URL || '',
    apiKey: process.env.EXTERNAL_CARD_VALIDATION_API_KEY || '',
    timeoutMs: toNumber(process.env.EXTERNAL_CARD_VALIDATION_TIMEOUT_MS, 4000),
    provider: process.env.EXTERNAL_CARD_VALIDATION_PROVIDER || 'external-validator'
  }
};

// Minimal runtime validations
if (!env.mongoUri) {
  console.warn('[WARN] MONGODB_URI not set. Set this before deploying to production.');
}
if (!env.encryptionKey || env.encryptionKey.length !== 32) {
  console.warn('[WARN] ENCRYPTION_KEY must be exactly 32 characters. Current length:', env.encryptionKey.length);
}

if (!env.externalCardValidation.url) {
  console.warn('[WARN] EXTERNAL_CARD_VALIDATION_URL not set. Card validation will be skipped.');
}
