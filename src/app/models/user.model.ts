export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  document?: string;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface UserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  document?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface SavedCard {
  id: string;
  userId: string;
  cardToken: string; // Token seguro do cartão (não o número real)
  lastFourDigits: string;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'unknown';
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveCardRequest {
  cardNumber: string;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  isDefault?: boolean;
}

export interface UserProfile {
  user: User;
  savedCards: SavedCard[];
  totalTransactions: number;
  lastLoginAt?: Date;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPassword {
  email: string;
}

export interface ResetPassword {
  token: string;
  newPassword: string;
  confirmPassword: string;
}