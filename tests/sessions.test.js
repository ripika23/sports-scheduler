process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('Session Management Integration Tests', () => {
  let adminUser, player1, player2;
  let adminAgent, player1Agent, player2Agent;
  let testSport;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Seed Admin
    adminUser = await db.User.create({
      name: 'Admin Host',
      email: 'admin.host@example.com',
      passwordHash: db.User.hashPassword('Password123!'),
      role: 'admin'
    });

    // Seed Player 1
    player1 = await db.User.create({
      name: 'Player One',
      email: 'player1@example.com',
      passwordHash: db.User.hashPassword('Password123!'),
      role: 'player'
    });

    // Seed Player 2
    player2 = await db.User.create({
      name: 'Player Two',
      email: 'player2@example.com',
      passwordHash: db.User.hashPassword('Password123!'),
      role: 'player'
    });

    // Create Sport
    testSport = await db.Sport.create({
      sportName: 'Football',
      description: 'Standard 11v11 or 7v7 football.',
      createdBy: adminUser.id
    });

    // Login player1
    player1Agent = request.agent(app);
    await player1Agent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'player1@example.com', password: 'Password123!' });

    // Login player2
    player2Agent = request.agent(app);
    await player2Agent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'player2@example.com', password: 'Password123!' });

    // Login admin
    adminAgent = request.agent(app);
    await adminAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: 'admin.host@example.com', password: 'Password123!' });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  let createdSessionId;

  describe('Session Creation (POST /sessions)', () => {
    it('should allow player to create a new session with starting rosters', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

      const res = await player1Agent
        .post('/sessions')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportId: testSport.id,
          sessionTitle: 'Weekend Football Clash',
          venue: 'Central Park Turf Field 1',
          sessionDate: futureDate,
          sessionTime: '17:00',
          teamAPlayers: 'Player One, Dave, Gary',
          teamBPlayers: 'Steve, Tony',
          additionalPlayersNeeded: 3
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/sessions\/\d+/);

      createdSessionId = res.headers.location.split('/').pop();

      const session = await db.Session.findByPk(createdSessionId);
      expect(session).not.toBeNull();
      expect(session.sessionTitle).toBe('Weekend Football Clash');
      expect(session.creatorId).toBe(player1.id);
      expect(session.additionalPlayersNeeded).toBe(3);
      expect(session.status).toBe('active');
    });

    it('should allow admin to create a session exactly like a player', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

      const res = await adminAgent
        .post('/sessions')
        .set('x-test-bypass-csrf', 'true')
        .send({
          sportId: testSport.id,
          sessionTitle: 'Admin Hosted Match',
          venue: 'Downtown Complex Court 2',
          sessionDate: futureDate,
          sessionTime: '19:00',
          teamAPlayers: 'Admin Host, Carl',
          teamBPlayers: 'Edward',
          additionalPlayersNeeded: 2
        });

      expect(res.status).toBe(302);
      const adminSessionId = res.headers.location.split('/').pop();
      const adminSession = await db.Session.findByPk(adminSessionId);
      expect(adminSession).not.toBeNull();
      expect(adminSession.creatorId).toBe(adminUser.id);
    });
  });

  describe('Session Joining (POST /sessions/:id/join)', () => {
    it('should allow a player to join an active session and decrement available slots', async () => {
      const sessionBefore = await db.Session.findByPk(createdSessionId);
      const slotsBefore = sessionBefore.additionalPlayersNeeded;

      const res = await player2Agent
        .post(`/sessions/${createdSessionId}/join`)
        .set('x-test-bypass-csrf', 'true');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`/sessions/${createdSessionId}`);

      const sessionAfter = await db.Session.findByPk(createdSessionId);
      expect(sessionAfter.additionalPlayersNeeded).toBe(slotsBefore - 1);

      // Verify participant record
      const participant = await db.SessionParticipant.findOne({
        where: { sessionId: createdSessionId, userId: player2.id }
      });
      expect(participant).not.toBeNull();

      // Verify player name appears on session details view
      const detailRes = await player2Agent.get(`/sessions/${createdSessionId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.text).toContain('Player Two');
    });

    it('should reject joining the same session twice', async () => {
      const res = await player2Agent
        .post(`/sessions/${createdSessionId}/join`)
        .set('x-test-bypass-csrf', 'true');

      expect(res.status).toBe(302);

      const count = await db.SessionParticipant.count({
        where: { sessionId: createdSessionId, userId: player2.id }
      });
      expect(count).toBe(1);
    });
  });

  describe('Session Cancellation (POST /sessions/:id/cancel)', () => {
    it('should reject cancellation by non-creator user', async () => {
      const res = await player2Agent
        .post(`/sessions/${createdSessionId}/cancel`)
        .set('x-test-bypass-csrf', 'true')
        .send({ cancellationReason: 'Trying to cancel someone else session' });

      expect(res.status).toBe(302);

      const session = await db.Session.findByPk(createdSessionId);
      expect(session.status).toBe('active');
    });

    it('should reject cancellation without a reason', async () => {
      const res = await player1Agent
        .post(`/sessions/${createdSessionId}/cancel`)
        .set('x-test-bypass-csrf', 'true')
        .send({ cancellationReason: '   ' });

      expect(res.status).toBe(302);

      const session = await db.Session.findByPk(createdSessionId);
      expect(session.status).toBe('active');
    });

    it('should allow session creator to cancel with mandatory reason and display cancellation badge', async () => {
      const res = await player1Agent
        .post(`/sessions/${createdSessionId}/cancel`)
        .set('x-test-bypass-csrf', 'true')
        .send({ cancellationReason: 'Severe thunderstorm advisory and court flooding.' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`/sessions/${createdSessionId}`);

      const session = await db.Session.findByPk(createdSessionId);
      expect(session.status).toBe('cancelled');
      expect(session.cancellationReason).toBe('Severe thunderstorm advisory and court flooding.');

      // Check that cancellation badge and reason are displayed on session page
      const showRes = await player2Agent.get(`/sessions/${createdSessionId}`);
      expect(showRes.status).toBe(200);
      expect(showRes.text).toContain('CANCELLED');
      expect(showRes.text).toContain('Severe thunderstorm advisory and court flooding.');
    });
  });
});
