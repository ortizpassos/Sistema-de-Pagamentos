export type TransactionStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'APPROVED' 
  | 'DECLINED' 
  | 'FAILED' 
  | 'EXPIRED';

export type PaymentMethod = 'credit_card' | 'pix';

export interface Customer {
  name: string;
  email: string;
  document?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customer: Customer;
  returnUrl: string;
  callbackUrl: string;
  createdAt: Date;
  updatedAt: Date;
  bankTransactionId?: string;
  bankPixId?: string;
  pixCode?: string;
  qrCodeImage?: string;
  expiresAt?: Date;
  userId?: string; // ID do usuário logado (opcional para pagamentos sem cadastro)
  savedCardId?: string; // ID do cartão salvo usado (se aplicável)
}

export interface PaymentInitiateRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customer: Customer;
  returnUrl: string;
  callbackUrl: string;
}

export interface CreditCardPaymentRequest {
  transactionId: string;
  cardNumber: string;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

export interface PixPaymentRequest {
  transactionId: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: Transaction;
  error?: {
    message: string;
    code?: string;
  };
}