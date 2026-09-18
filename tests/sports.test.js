process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('Sports Management Integration Tests', () => {
  let adminAgent;
  let adminUser;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Create Admin User
    adminUser = await db.User.create({
      name: 'Admin Tester',
      email: 'admin.sports@example.com',
      passwordHash: db.User.hashPassword('AdminPass123!'),
      role: 'admin'
    });

    // Authenticate Admin Agent
    adminAgent = request.agent(app);
    await adminAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({
        email: 'admin.sports@example.com',
        password: 'AdminPass123!'
      });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('Sport Creation (POST /sports)', () => {
    it('should allow admin to create a new sport', async () => {
      const res = await adminAgent
        .post('/sports')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportName: 'Badminton',
          description: 'Racket sport played with shuttlecock.'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sports');

      const sport = await db.Sport.findOne({ where: { sportName: 'Badminton' } });
      expect(sport).not.toBeNull();
      expect(sport.sportName).toBe('Badminton');
      expect(sport.createdBy).toBe(adminUser.id);
    });

    it('should reject duplicate sport creation', async () => {
      const res = await adminAgent
        .post('/sports')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportName: 'badminton', // lowercase duplicate
          description: 'Duplicate test description'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sports/new');
    });

    it('should reject blank sport name', async () => {
      const res = await adminAgent
        .post('/sports')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportName: '   ',
          description: 'Empty name test'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sports/new');
    });
  });

  describe('Sport Editing (POST /sports/:id)', () => {
    it('should allow admin to edit an existing sport', async () => {
      const sport = await db.Sport.findOne({ where: { sportName: 'Badminton' } });

      const res = await adminAgent
        .post(`/sports/${sport.id}`)
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportName: 'Pro Badminton',
          description: 'Updated professional badminton description.'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sports');

      await sport.reload();
      expect(sport.sportName).toBe('Pro Badminton');
    });
  });

  describe('Sport Deletion (POST /sports/:id/delete)', () => {
    it('should allow admin to delete a sport', async () => {
      const sport = await db.Sport.findOne({ where: { sportName: 'Pro Badminton' } });

      const res = await adminAgent
        .post(`/sports/${sport.id}/delete`)
        .set('x-test-bypass-csrf', 'true');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sports');

      const check = await db.Sport.findByPk(sport.id);
      expect(check).toBeNull();
    });
  });
});
