process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('Authentication System Integration Tests', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('User Signup (POST /auth/signup)', () => {
    it('should register a new player user and hash the password', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('x-test-bypass-csrf', 'true')
        .send({
          name: 'Integration Player',
          email: 'player.test@example.com',
          password: 'TestPassword123!',
          role: 'player'
        });

      // Successful signup redirects to /dashboard
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      const user = await db.User.findOne({ where: { email: 'player.test@example.com' } });
      expect(user).not.toBeNull();
      expect(user.name).toBe('Integration Player');
      expect(user.role).toBe('player');
      expect(user.passwordHash).not.toBe('TestPassword123!');
      expect(user.validPassword('TestPassword123!')).toBe(true);
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('x-test-bypass-csrf', 'true')
        .send({
          name: 'Duplicate Player',
          email: 'player.test@example.com',
          password: 'TestPassword123!',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/login');
    });

    it('should reject signup with invalid email format', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('x-test-bypass-csrf', 'true')
        .send({
          name: 'Invalid Email',
          email: 'invalid-email-address',
          password: 'TestPassword123!',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signup');
    });
  });

  describe('User Login (POST /auth/login)', () => {
    it('should login an existing user with correct credentials and establish session', async () => {
      const agent = request.agent(app);

      const res = await agent
        .post('/auth/login')
        .set('x-test-bypass-csrf', 'true')
        .send({
          email: 'player.test@example.com',
          password: 'TestPassword123!'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');

      // Subsequent request using agent session should access dashboard
      const dashboardRes = await agent.get('/dashboard');
      expect(dashboardRes.status).toBe(200);
      expect(dashboardRes.text).toContain('Integration Player');
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('x-test-bypass-csrf', 'true')
        .send({
          email: 'player.test@example.com',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/login');
    });
  });

  describe('User Logout (/auth/logout)', () => {
    it('should log out an authenticated user and redirect to login', async () => {
      const agent = request.agent(app);

      // Login first
      await agent
        .post('/auth/login')
        .set('x-test-bypass-csrf', 'true')
        .send({
          email: 'player.test@example.com',
          password: 'TestPassword123!'
        });

      // Logout
      const logoutRes = await agent
        .post('/auth/logout')
        .set('x-test-bypass-csrf', 'true');

      expect(logoutRes.status).toBe(302);
      expect(logoutRes.headers.location).toBe('/auth/login');

      // Trying to access dashboard should now redirect to login
      const protectedRes = await agent.get('/dashboard');
      expect(protectedRes.status).toBe(302);
      expect(protectedRes.headers.location).toBe('/auth/login');
    });
  });
});
