require('dotenv').config();
const app = require('./app');
const db = require('./models');
const localPersistence = require('./config/localPersistence');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    // In non-production without live PostgreSQL, ensure schema is initialized
    if (!process.env.DATABASE_URL) {
      await db.sequelize.sync();
      console.log('Local models synchronized.');

      const restored = await localPersistence.loadDatabase(db);
      if (restored) {
        console.log('Local database state restored from persistence store.');
      } else {
        const userCount = await db.User.count();
        if (userCount === 0) {
          console.log('No local seed data found. Auto-seeding initial sports and accounts...');
          const seed = require('./scripts/seed');
          await seed({ exitOnComplete: false, forceSync: false });
        }
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(` Sports Scheduler Platform is Live!     `);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Server URL : http://localhost:${PORT}  `);
      console.log(`=========================================`);
    });

    const shutdown = () => {
      console.log('\nShutting down gracefully...');
      if (!process.env.DATABASE_URL) {
        localPersistence.saveDatabase(db).catch(() => {});
      }
      server.close(async () => {
        await db.sequelize.close();
        console.log('Database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
