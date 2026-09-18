process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('Authorization & Role Guard Integration Tests', () => {
  let playerAgent;
  let adminAgent;
  let guestAgent;
  let testSport;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Seed Admin
    const admin = await db.User.create({
      name: 'Admin Role User',
      email: 'admin.role@example.com',
      passwordHash: db.User.hashPassword('Password123!'),
      role: 'admin'
    });

    // Seed Player
    await db.User.create({
      name: 'Player Role User',
      email: 'player.role@example.com',
      passwordHash: db.User.hashPassword('Password123!'),
      role: 'player'
    });

    testSport = await db.Sport.create({
      sportName: 'Volleyball',
      description: 'Test sport for authz',
      createdBy: admin.id
    });

    // Admin Agent
    adminAgent = request.agent(app);
    await adminAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'admin.role@example.com', password: 'Password123!' });

    // Player Agent
    playerAgent = request.agent(app);
    await playerAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'player.role@example.com', password: 'Password123!' });

    // Unauthenticated Guest Agent
    guestAgent = request.agent(app);
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('Unauthenticated Access Controls', () => {
    it('should redirect unauthenticated guests from /dashboard to /auth/login', async () => {
      const res = await guestAgent.get('/dashboard');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/login');
    });

    it('should redirect unauthenticated guests from /sessions/available to /auth/login', async () => {
      const res = await guestAgent.get('/sessions/available');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/login');
    });

    it('should redirect unauthenticated guests from /reports to /auth/login', async () => {
      const res = await guestAgent.get('/reports');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/auth/login');
    });
  });

  describe('Player Blocked From Admin Routes (403 Forbidden)', () => {
    it('should block player from accessing GET /sports/new', async () => {
      const res = await playerAgent.get('/sports/new');
      expect(res.status).toBe(403);
      expect(res.text).toContain('Access Denied');
    });

    it('should block player from executing POST /sports (create sport)', async () => {
      const res = await playerAgent
        .post('/sports')
        .set('x-test-bypass-csrf', 'true')
        .send({ sportName: 'Unauthorized Sport', description: 'desc' });

      expect(res.status).toBe(403);
      expect(res.text).toContain('Access Denied');
    });

    it('should block player from accessing GET /sports/:id/edit', async () => {
      const res = await playerAgent.get(`/sports/${testSport.id}/edit`);
      expect(res.status).toBe(403);
      expect(res.text).toContain('Access Denied');
    });

    it('should block player from executing POST /sports/:id (update sport)', async () => {
      const res = await playerAgent
        .post(`/sports/${testSport.id}`)
        .set('x-test-bypass-csrf', 'true')
        .send({ sportName: 'Hacked Sport' });

      expect(res.status).toBe(403);
      expect(res.text).toContain('Access Denied');
    });

    it('should block player from executing POST /sports/:id/delete', async () => {
      const res = await playerAgent
        .post(`/sports/${testSport.id}/delete`)
        .set('x-test-bypass-csrf', 'true');

      expect(res.status).toBe(403);
      expect(res.text).toContain('Access Denied');
    });

    it('should block player from accessing GET /reports dashboard', async () => {
      const res = await playerAgent.get('/reports');
      expect(res.status).toBe(403);
      expect(res.text).toContain('Access Denied');
    });
  });

  describe('Admin Authorized Access', () => {
    it('should allow admin to access GET /sports/new', async () => {
      const res = await adminAgent.get('/sports/new');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Add New Sport');
    });

    it('should allow admin to access GET /reports', async () => {
      const res = await adminAgent.get('/reports');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sports Reporting & Analytics Dashboard');
    });
  });
});
