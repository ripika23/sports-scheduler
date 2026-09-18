const db = require('../models');
const localPersistence = require('../config/localPersistence');

async function verify() {
  try {
    console.log('--- Verifying Database Records ---');
    await db.sequelize.sync();
    await localPersistence.loadDatabase(db);

    // 1. Check admin user
    const admin = await db.User.findOne({ where: { email: 'admin@sportsscheduler.com' } });
    if (!admin) {
      console.error('❌ FAILED: admin@sportsscheduler.com was not found in the database.');
      process.exit(1);
    }
    console.log(`✅ Found Admin Account: ${admin.email} (Role: ${admin.role})`);

    // 2. Check 5 required sports
    const expectedSports = ['Football', 'Basketball', 'Cricket', 'Badminton', 'Volleyball'];
    const sports = await db.Sport.findAll({ order: [['id', 'ASC']] });
    const sportNames = sports.map((s) => s.sportName);

    console.log(`✅ Found ${sports.length} Total Sports:`, sportNames.join(', '));

    let allFound = true;
    for (const name of expectedSports) {
      if (sportNames.includes(name)) {
        console.log(`  ✓ Sport "${name}" exists`);
      } else {
        console.error(`  ❌ Sport "${name}" is MISSING`);
        allFound = false;
      }
    }

    if (!allFound) {
      console.error('❌ Verification failed: some sports are missing.');
      process.exit(1);
    }

    console.log('\n🎉 ALL REQUIRED RECORDS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Verification encountered an error:', err);
    process.exit(1);
  }
}

verify();
