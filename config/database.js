require('dotenv').config();
const { Sequelize } = require('sequelize');

try {
  const moment = require('moment');
  moment.suppressDeprecationWarnings = true;
} catch {}

const env = process.env.NODE_ENV || 'development';
let sequelize;

if (process.env.DATABASE_URL) {
  // Production or live PostgreSQL instance (Render / Supabase / local PostgreSQL)
  const isProduction = env === 'production';
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {},
    logging: isProduction ? false : false
  });
} else if (process.env.DB_NAME && process.env.DB_USER) {
  // Configured discrete PostgreSQL credentials
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );
} else {
  // In-memory PostgreSQL instance using pg-mem for local dev & automated Jest tests
  // Fully emulates PostgreSQL dialect without native C++ compilation or external daemon
  const { newDb } = require('pg-mem');
  const db = newDb({ autoCreateForeignKeyIndices: true });

  // Patch MemoryTable prototype so explicit primary key inserts advance the serial counter
  try {
    db.public.none('CREATE TABLE IF NOT EXISTS _pgmem_serial_probe (id SERIAL);');
    const probeTable = db.getTable('_pgmem_serial_probe');
    const proto = Object.getPrototypeOf(probeTable);
    if (proto && !proto.__serialPatched && typeof proto.doInsert === 'function') {
      const origDoInsert = proto.doInsert;
      proto.doInsert = function (t, toInsert, opts) {
        const res = origDoInsert.call(this, t, toInsert, opts);
        if (this.serialsId) {
          let serials = t.getMap(this.serialsId);
          if (serials) {
            for (const [k, v] of serials.entries()) {
              if (typeof toInsert[k] === 'number' && toInsert[k] > v) {
                serials = serials.set(k, toInsert[k]);
              }
            }
            t.set(this.serialsId, serials);
          }
        }
        return res;
      };
      proto.__serialPatched = true;
    }
  } catch {}

  // Register pg functions if needed
  db.public.registerFunction({
    implementation: () => 'PostgreSQL 15.0 (pg-mem)',
    name: 'version'
  });
  const pg = db.adapters.createPg();

  sequelize = new Sequelize('postgres://postgres:postgres@localhost/sports_scheduler', {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false
  });
}

module.exports = sequelize;
