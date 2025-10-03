import request from 'supertest';
import app from '../../src/app';
import { jest } from '@jest/globals';

// Mock axios for external validation tests
jest.mock('axios', () => ({
  post: jest.fn(async (url: string, body: any) => {
    if (body.cardNumber === '4000000000000002') {
      return { data: { valid: false, reason: 'CARD_STOLEN' } };
    }
    return { data: { valid: true } };
  })
}));

async function registerAndLogin() {
  const user = {
    email: 'cards@example.com',
    password: 'Senha@123',
    firstName: 'Cards',
    lastName: 'User'
  };
  await request(app).post('/api/auth/register').send(user);
  const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return login.body.data.token as string;
}

describe('Cards API', () => {
  it('should save and list a card (external validation disabled default)', async () => {
    const token = await registerAndLogin();
    const saveRes = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cardNumber: '4111111111111111',
        cardHolderName: 'JOAO SILVA',
        expirationMonth: '12',
        expirationYear: '2030',
        cvv: '123',
        isDefault: true
      })
      .expect(201);

    expect(saveRes.body.success).toBe(true);
    const listRes = await request(app)
      .get('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listRes.body.data.length).toBe(1);
  });

  it('should reject card when external validation fails (simulated)', async () => {
    // Simulate enabling external validation at runtime by setting env flag
    process.env.EXTERNAL_CARD_API_ENABLED = 'true';
    process.env.EXTERNAL_CARD_API_URL = 'https://mocked-validation.test';
    const token = await registerAndLogin();
    const saveRes = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cardNumber: '4000000000000002',
        cardHolderName: 'JOAO SILVA',
        expirationMonth: '12',
        expirationYear: '2030',
        cvv: '123'
      })
      .expect(422);
    expect(saveRes.body.error.code).toBe('EXTERNAL_CARD_VALIDATION_FAILED');
  });
});
