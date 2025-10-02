import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedCard, SaveCardRequest } from '../models/user.model';

export interface SavedCardResponse {
  success: boolean;
  data?: SavedCard | SavedCard[];
  error?: {
    message: string;
    code?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = 'http://localhost:3000/api/cards';

  constructor(private http: HttpClient) {}

  // Listar cartões salvos do usuário
  getUserCards(): Observable<SavedCardResponse> {
    return this.http.get<SavedCardResponse>(`${this.apiUrl}`);
  }

  // Salvar novo cartão
  saveCard(cardData: SaveCardRequest): Observable<SavedCardResponse> {
    const payload = this.buildSavePayload(cardData);
    return this.http.post<SavedCardResponse>(`${this.apiUrl}`, payload);
  }

  // Obter cartão específico
  getCard(cardId: string): Observable<SavedCardResponse> {
    return this.http.get<SavedCardResponse>(`${this.apiUrl}/${cardId}`);
  }

  // Atualizar informações do cartão (nome, padrão)
  updateCard(cardId: string, updates: Partial<SavedCard>): Observable<SavedCardResponse> {
    return this.http.put<SavedCardResponse>(`${this.apiUrl}/${cardId}`, updates);
  }

  // Remover cartão
  deleteCard(cardId: string): Observable<SavedCardResponse> {
    return this.http.delete<SavedCardResponse>(`${this.apiUrl}/${cardId}`);
  }

  // Definir cartão como padrão
  setDefaultCard(cardId: string): Observable<SavedCardResponse> {
    return this.http.patch<SavedCardResponse>(`${this.apiUrl}/${cardId}/set-default`, {});
  }

  // Validar se o cartão pode ser salvo (sem informações sensíveis)
  validateCardForSaving(cardData: SaveCardRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar número do cartão
    const cardNumber = cardData.cardNumber.replace(/\D/g, '');
    if (!this.validateCardNumber(cardNumber)) {
      errors.push('Número do cartão inválido');
    }

    // Validar nome do titular
    if (!cardData.cardHolderName.trim()) {
      errors.push('Nome do titular é obrigatório');
    } else {
      const normalized = this.normalizeName(cardData.cardHolderName);
      if (!/^[A-Z ]{2,100}$/.test(normalized)) {
        errors.push('Nome do titular deve conter apenas letras e espaços (sem acentos)');
      }
    }

    // Validar data de expiração
    const month = parseInt(cardData.expirationMonth);
    const year = parseInt(cardData.expirationYear);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      errors.push('Mês de expiração inválido');
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.push('Cartão expirado');
    }

    // Validar CVV
    if (!/^\d{3,4}$/.test(cardData.cvv)) {
      errors.push('CVV inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Montar payload sanitizado para envio
  private buildSavePayload(data: SaveCardRequest) {
    const number = data.cardNumber.replace(/\D/g, '');
    const month = data.expirationMonth.padStart(2, '0');
    const year = data.expirationYear.trim();
    const name = this.normalizeName(data.cardHolderName);
    return {
      cardNumber: number,
      cardHolderName: name,
      expirationMonth: month,
      expirationYear: year,
      cvv: data.cvv.replace(/\D/g, ''),
      isDefault: !!data.isDefault
    };
  }

  // Normalizar nome (remover acentos e caracteres inválidos, uppercase)
  private normalizeName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[^A-Za-z\s]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Validar número do cartão usando algoritmo de Luhn
  private validateCardNumber(cardNumber: string): boolean {
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

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

  // Obter bandeira do cartão
  getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^(4011|4312|4389|4514|4573|6277|6362|6363|6504|6505|6516|6550)/.test(cleaned)) return 'elo';
    
    return 'unknown';
  }

  // Mascarar número do cartão para exibição
  maskCardNumber(cardNumber: string): string {
    const lastFour = cardNumber.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  }

  // Formatar número do cartão
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  }

  // Obter ícone da bandeira do cartão
  getCardBrandIcon(brand: string): string {
    const icons: { [key: string]: string } = {
      'visa': '💳',
      'mastercard': '💳', 
      'amex': '💳',
      'elo': '💳',
      'unknown': '💳'
    };
    return icons[brand] || icons['unknown'];
  }

  // Verificar se o cartão está prestes a expirar (próximos 3 meses)
  isCardExpiringSoon(expirationMonth: string, expirationYear: string): boolean {
    const now = new Date();
    const expDate = new Date(parseInt(expirationYear), parseInt(expirationMonth) - 1);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    return expDate <= threeMonthsFromNow && expDate > now;
  }
}