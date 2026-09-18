const db = require('../models');
const { saveDatabase } = require('../config/localPersistence');

async function seed(options = { exitOnComplete: true, forceSync: true }) {
  try {
    if (options.forceSync) {
      console.log('Synchronizing database models before seeding...');
      await db.sequelize.sync({ force: true });
    }

    console.log('Seeding users...');
    const admin = await db.User.create({
      name: 'System Administrator',
      email: 'admin@sportsscheduler.com',
      passwordHash: db.User.hashPassword('AdminPassword123!'),
      role: 'admin'
    });

    const alice = await db.User.create({
      name: 'Alice Walker',
      email: 'alice@example.com',
      passwordHash: db.User.hashPassword('PlayerPassword123!'),
      role: 'player'
    });

    const bob = await db.User.create({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      passwordHash: db.User.hashPassword('PlayerPassword123!'),
      role: 'player'
    });

    const charlie = await db.User.create({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      passwordHash: db.User.hashPassword('PlayerPassword123!'),
      role: 'player'
    });

    console.log('Seeding sports...');
    const football = await db.Sport.create({
      sportName: 'Football',
      description: '11-a-side or 7-a-side association football on turf or grass.',
      createdBy: admin.id
    });

    const basketball = await db.Sport.create({
      sportName: 'Basketball',
      description: '5-on-5 full court or 3-on-3 half court basketball pickup matches.',
      createdBy: admin.id
    });

    const cricket = await db.Sport.create({
      sportName: 'Cricket',
      description: 'T20 or box cricket matches with tennis or leather ball.',
      createdBy: admin.id
    });

    await db.Sport.create({
      sportName: 'Badminton',
      description: 'Indoor singles and doubles badminton matches.',
      createdBy: admin.id
    });

    await db.Sport.create({
      sportName: 'Volleyball',
      description: '6-a-side competitive or recreational volleyball games.',
      createdBy: admin.id
    });

    // Helper for dates in future
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureDate2 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureDate3 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('Seeding sample sessions...');
    // 1. Open session created by Alice
    const session1 = await db.Session.create({
      sportId: football.id,
      creatorId: alice.id,
      sessionTitle: 'Weekend 7v7 Turf Clash',
      venue: 'Metropolis Sports Arena, Field 2',
      sessionDate: futureDate1,
      sessionTime: '18:00',
      teamAPlayers: 'Alice Walker, David Green, Frank Miller',
      teamBPlayers: 'George Clark, Henry Scott',
      additionalPlayersNeeded: 3,
      status: 'active'
    });

    // 2. Open session created by Admin (Admins act as players too!)
    const session2 = await db.Session.create({
      sportId: basketball.id,
      creatorId: admin.id,
      sessionTitle: 'Friday Night 5v5 Open Runs',
      venue: 'Downtown Community Rec Center Court A',
      sessionDate: futureDate2,
      sessionTime: '19:30',
      teamAPlayers: 'System Administrator, Liam Vance',
      teamBPlayers: 'Noah Ray, Mason Cole',
      additionalPlayersNeeded: 4,
      status: 'active'
    });

    // 3. Cancelled session created by Bob with mandatory cancellationReason
    await db.Session.create({
      sportId: cricket.id,
      creatorId: bob.id,
      sessionTitle: 'Sunday Morning Box Cricket League',
      venue: 'Green Valley Indoor Sports Complex',
      sessionDate: futureDate3,
      sessionTime: '08:00',
      teamAPlayers: 'Bob Johnson, Charlie Brown',
      teamBPlayers: 'Sam Wilson, Peter Parker',
      additionalPlayersNeeded: 2,
      cancellationReason: 'Heavy rain forecasted and turf maintenance underway.',
      status: 'cancelled'
    });

    console.log('Seeding session participants...');
    // Bob joins Alice's football session
    await db.SessionParticipant.create({
      sessionId: session1.id,
      userId: bob.id,
      team: 'B'
    });
    // Slot decreased when joined
    session1.additionalPlayersNeeded = 2;
    await session1.save();

    // Charlie joins Admin's basketball session
    await db.SessionParticipant.create({
      sessionId: session2.id,
      userId: charlie.id,
      team: 'A'
    });
    session2.additionalPlayersNeeded = 3;
    await session2.save();

    await saveDatabase(db);
    console.log('Seed completed and persisted successfully!');
    if (options.exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    if (options.exitOnComplete) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seed({ exitOnComplete: true, forceSync: true });
}

module.exports = seed;
