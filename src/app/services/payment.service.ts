import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { 
  Transaction, 
  CreditCardPaymentRequest, 
  PixPaymentRequest, 
  PaymentResponse,
  PaymentInitiateRequest 
} from '../models/transaction.model';
import { getApiBase } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = getApiBase(); // Dinâmico (local ou produção)

  constructor(private http: HttpClient) {}

  // Iniciar uma transação de pagamento
  initiatePayment(request: PaymentInitiateRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payments/initiate`, request);
  }

  // Processar pagamento com cartão de crédito
  processCreditCardPayment(request: CreditCardPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payments/credit-card`, request);
  }

  // Processar pagamento PIX
  processPixPayment(request: PixPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payments/pix`, request);
  }

  // Verificar status do PIX
  checkPixStatus(transactionId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/payments/pix/${transactionId}/status`);
  }

  // Obter transação por ID
  getTransaction(transactionId: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/payments/${transactionId}`);
  }

  // Obter transações recentes
  getRecentTransactions(limit = 5): Observable<{ success: boolean; data?: { transactions: Transaction[] } }> {
    return this.http.get<{ success: boolean; data?: { transactions: Transaction[] } }>(`${this.apiUrl}/payments/recent?limit=${limit}`);
  }

  // Histórico paginado de transações
  getTransactionHistory(options: { page?: number; limit?: number; status?: string; paymentMethod?: string; sort?: string; direction?: 'asc'|'desc' } = {}): Observable<{ success: boolean; data?: { transactions: Transaction[]; pagination: any; sort: string; direction: string } }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.status) params.append('status', options.status);
    if (options.paymentMethod) params.append('paymentMethod', options.paymentMethod);
    if (options.sort) params.append('sort', options.sort);
    if (options.direction) params.append('direction', options.direction);
    const qs = params.toString();
    return this.http.get<{ success: boolean; data?: { transactions: Transaction[]; pagination: any; sort: string; direction: string } }>(`${this.apiUrl}/payments${qs ? '?' + qs : ''}`);
  }

  // Validação de cartão de crédito usando algoritmo de Luhn
  validateCreditCard(cardNumber: string): boolean {
    // Remove espaços e caracteres não numéricos
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Algoritmo de Luhn
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
  }

  // Formatação do número do cartão
  formatCardNumber(value: string): string {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '');
    
    // Adiciona espaços a cada 4 dígitos
    const match = cleaned.match(/.{1,4}/g);
    
    return match ? match.join(' ') : cleaned;
  }

  // Validação de data de expiração
  validateExpirationDate(month: string, year: string): boolean {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11
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
  }

  // Formatação de moeda
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'BRL' ? 'BRL' : currency,
    }).format(amount);
  }

  // Obter bandeira do cartão
  getCardBrand(cardNumber: string): string {
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
  }

  // Gerar QR Code PIX (simulado)
  generatePixQrCode(pixCode: string): string {
    // Em um ambiente real, isso seria feito pelo backend
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }
}