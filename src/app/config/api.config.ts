// Centraliza definição da base da API
// Regras:
// 1. Se window.__API_BASE__ estiver definido, usa ele (override manual para testes)
// 2. Se hostname for localhost / 127.0.0.1 usa http://localhost:3000/api
// 3. Caso contrário usa produção (fallback atual)
// Fácil de evoluir depois para usar environment.* caso adicione arquivos de ambiente Angular.

export function getApiBase(): string {
  const w = window as any;
  if (w.__API_BASE__) return w.__API_BASE__;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return 'https://sistema-de-pagamentos-backend.onrender.com/api';
}
