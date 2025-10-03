// Centraliza mapeamento de códigos/mensagens da validação externa de cartões
// Mantém consistência entre telas de cadastro e uso de cartão

const REASON_MAP: Record<string, string> = {
  'CARD_STOLEN': 'Cartão Roubado',
  'INSUFFICIENT_FUNDS': 'Saldo ou limite insuficiente',
  'CARD_EXPIRED': 'Cartão expirado',
  'EXTERNAL_DECLINE': 'Transação recusada pela operadora',
  'TIMEOUT': 'Serviço de validação externo não respondeu a tempo',
  'EXTERNAL_ERROR': 'Falha na validação externa',
  'INVALID_FORMAT': 'Formato de número de cartão inválido',
  'CONFIG_MISSING_URL': 'Configuração de URL da validação externa ausente'
};

export function mapExternalCardReason(raw: string | undefined | null): string | null {
  if (!raw) return null;
  // Procura código direto
  const codeMatch = raw.match(/(CARD_STOLEN|INSUFFICIENT_FUNDS|CARD_EXPIRED|EXTERNAL_DECLINE|TIMEOUT|EXTERNAL_ERROR|INVALID_FORMAT|CONFIG_MISSING_URL)/);
  if (codeMatch) {
    return REASON_MAP[codeMatch[1]] || raw;
  }
  // Caso forma "...: CODE" no final
  const afterColon = raw.split(':').pop()?.trim();
  if (afterColon && REASON_MAP[afterColon]) {
    return REASON_MAP[afterColon];
  }
  return raw;
}

export const EXTERNAL_REASON_CODES = Object.keys(REASON_MAP);
