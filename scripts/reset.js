const { clearDatabase } = require('../config/localPersistence');
const seed = require('./seed');

async function reset() {
  try {
    console.log('Resetting local database and persistence store...');
    clearDatabase();
    await seed({ exitOnComplete: true, forceSync: true });
  } catch (err) {
    console.error('Reset failed:', err);
    process.exit(1);
  }
}

reset();
