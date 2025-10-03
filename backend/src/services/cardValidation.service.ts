import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface ExternalCardValidationResult {
  valid: boolean;
  brand?: string;
  fraudScore?: number;
  reasons?: string[];
  raw?: any;
}

interface ValidationInput {
  cardNumber: string;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  user: { id: string; email: string };
}

class CardValidationService {
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (env.externalCardValidation.apiKey) {
      headers['Authorization'] = `Bearer ${env.externalCardValidation.apiKey}`;
    }
    return headers;
  }

  async validate(input: ValidationInput): Promise<ExternalCardValidationResult | null> {
    if (!env.externalCardValidation.url) {
      // Sem URL configurada, pular validação (retornar null para indicar bypass)
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.externalCardValidation.timeoutMs);

    try {
      const response = await fetch(env.externalCardValidation.url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          cardNumber: input.cardNumber,
            expirationMonth: input.expirationMonth,
            expirationYear: input.expirationYear,
            cvv: input.cvv,
            cardHolderName: input.cardHolderName,
            user: input.user
        }),
        signal: controller.signal
      });

      const json: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = json?.message || `External validation failed with status ${response.status}`;
        throw new AppError(msg, 502, 'CARD_VALIDATION_UPSTREAM_ERROR');
      }

      return {
        valid: !!json.valid,
        brand: json.brand,
        fraudScore: json.fraudScore,
        reasons: Array.isArray(json.reasons) ? json.reasons : [],
        raw: json
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new AppError('External card validation timeout', 504, 'CARD_VALIDATION_TIMEOUT');
      }
      if (err instanceof AppError) throw err;
      throw new AppError(err.message || 'External card validation error', 502, 'CARD_VALIDATION_ERROR');
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const cardValidationService = new CardValidationService();