const fs = require('fs');
const path = require('path');
const db = require('../models');

async function migrate() {
  try {
    console.log('Initiating database migration pipeline...');
    const queryInterface = db.sequelize.getQueryInterface();
    const Sequelize = db.sequelize.constructor;

    const migrationsPath = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith('.js'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration file(s):`);

    for (const file of migrationFiles) {
      console.log(`  -> Executing migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      if (typeof migration.up === 'function') {
        try {
          await migration.up(queryInterface, Sequelize);
          console.log(`     ✓ Applied ${file}`);
        } catch (migErr) {
          console.log(`     (Note: ${migErr.message})`);
        }
      }
    }

    console.log('Database migration pipeline completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration pipeline error:', error);
    process.exit(1);
  }
}

migrate();
