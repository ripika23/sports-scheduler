process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('Validation & Security Layer Integration Tests', () => {
  let playerAgent;
  let adminAgent;
  let testSport;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Seed Admin
    const admin = await db.User.create({
      name: 'Validation Admin',
      email: 'val.admin@example.com',
      passwordHash: db.User.hashPassword('Pass1234!'),
      role: 'admin'
    });

    // Seed Player
    await db.User.create({
      name: 'Validation Player',
      email: 'val.player@example.com',
      passwordHash: db.User.hashPassword('Pass1234!'),
      role: 'player'
    });

    testSport = await db.Sport.create({
      sportName: 'Tennis',
      description: 'Court tennis',
      createdBy: admin.id
    });

    adminAgent = request.agent(app);
    await adminAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'val.admin@example.com', password: 'Pass1234!' });

    playerAgent = request.agent(app);
    await playerAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'val.player@example.com', password: 'Pass1234!' });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('User Validation', () => {
    it('should reject signup with weak password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('x-test-bypass-csrf', 'true')
        .send({
          name: 'Short Pass User',
          email: 'shortpass@example.com',
          password: '123'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signup');
    });

    it('should reject signup with blank name', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('x-test-bypass-csrf', 'true')
        .send({
          name: '   ',
          email: 'noname@example.com',
          password: 'ValidPassword123'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/signup');
    });
  });

  describe('Sport Validation', () => {
    it('should reject creating a sport with whitespace-only name', async () => {
      const res = await adminAgent
        .post('/sports')
        .set('x-test-bypass-csrf', 'true')
        .send({ sportName: '    ', description: 'empty test' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sports/new');
    });
  });

  describe('Session Validation', () => {
    it('should reject session creation with blank session title', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await playerAgent
        .post('/sessions')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportId: testSport.id,
          sessionTitle: '   ',
          venue: 'City Stadium',
          sessionDate: futureDate,
          sessionTime: '15:00',
          additionalPlayersNeeded: 2
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sessions/new');
    });

    it('should reject session creation with blank venue', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await playerAgent
        .post('/sessions')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportId: testSport.id,
          sessionTitle: 'Valid Title',
          venue: '    ',
          sessionDate: futureDate,
          sessionTime: '15:00',
          additionalPlayersNeeded: 2
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sessions/new');
    });

    it('should reject session creation with past date', async () => {
      const pastDate = '2020-01-01';
      const res = await playerAgent
        .post('/sessions')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportId: testSport.id,
          sessionTitle: 'Past Date Match',
          venue: 'City Stadium',
          sessionDate: pastDate,
          sessionTime: '15:00',
          additionalPlayersNeeded: 2
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sessions/new');
    });

    it('should reject session creation with negative player count', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await playerAgent
        .post('/sessions')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportId: testSport.id,
          sessionTitle: 'Negative Slots Match',
          venue: 'City Stadium',
          sessionDate: futureDate,
          sessionTime: '15:00',
          additionalPlayersNeeded: -5
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sessions/new');
    });
  });

  describe('CSRF Protection Verification', () => {
    it('should reject mutating POST request when CSRF token is missing and bypass header is not present', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          name: 'CSRF Attacker',
          email: 'csrf@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(403);
      expect(res.text).toContain('CSRF');
    });
  });
});
