// Mock Card Validation API
// Uso: npm run mock:card
// Ajuste variáveis de ambiente do backend para apontar para http://localhost:4001/validate

const http = require('http');

function luhnValid(num) {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return (sum % 10) === 0;
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/validate')) {
    const url = new URL(req.url, 'http://localhost');
    const delay = Number(url.searchParams.get('delay') || '0');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body || '{}'); } catch { }
      const { cardNumber, expirationMonth, expirationYear, cvv, cardHolderName } = data;

      const respond = (fn) => setTimeout(fn, delay);

      if (!cardNumber || !luhnValid(cardNumber)) {
        return respond(() => json(res, 200, { valid: false, reasons: ['luhn_failed'] }));
      }

      const now = new Date();
      const expYear = parseInt(expirationYear, 10);
      const expMonth = parseInt(expirationMonth, 10);
      if (isNaN(expYear) || isNaN(expMonth) || expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < (now.getMonth() + 1))) {
        return respond(() => json(res, 200, { valid: false, reasons: ['expired'] }));
      }

      if (cvv === '999') {
        return respond(() => json(res, 200, { valid: true, brand: 'visa', fraudScore: 88, reasons: ['suspicious_cvv'] }));
      }

      if ((cardHolderName || '').includes('ERR')) {
        return respond(() => json(res, 500, { message: 'Upstream failure simulation' }));
      }

      const brand = cvv === '777' ? 'mastercard' : 'visa';

      respond(() => json(res, 200, {
        valid: true,
        brand,
        fraudScore: Math.floor(Math.random() * 40),
        reasons: []
      }));
    });
    return;
  }
  json(res, 404, { message: 'Not found' });
});

server.listen(4001, () => {
  console.log('Mock Card Validation API running on http://localhost:4001/validate');
  console.log('Use ?delay=5000 para simular timeout');
});
