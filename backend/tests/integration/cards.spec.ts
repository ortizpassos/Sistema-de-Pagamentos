import request from 'supertest';
import app from '../../src/app';

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
  it('should save and list a card', async () => {
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
});
