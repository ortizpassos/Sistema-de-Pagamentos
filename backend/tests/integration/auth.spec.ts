import request from 'supertest';
import app from '../../src/app';

describe('Auth Flow', () => {
  const user = {
    email: 'user1@example.com',
    password: 'Senha@123',
    firstName: 'User',
    lastName: 'Test'
  };

  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email.toLowerCase());
  });

  it('should login the user and return token', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });
});
