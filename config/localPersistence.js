const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function saveDatabase(db) {
  if (process.env.DATABASE_URL || process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    ensureDataDir();
    const [users, sports, sessions, participants] = await Promise.all([
      db.User.findAll({ raw: true, order: [['id', 'ASC']] }),
      db.Sport.findAll({ raw: true, order: [['id', 'ASC']] }),
      db.Session.findAll({ raw: true, order: [['id', 'ASC']] }),
      db.SessionParticipant.findAll({ raw: true, order: [['id', 'ASC']] })
    ]);

    const payload = {
      savedAt: new Date().toISOString(),
      users,
      sports,
      sessions,
      participants
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
    return payload;
  } catch (err) {
    console.warn('[Persistence] Warning saving local database:', err.message);
  }
}

async function loadDatabase(db) {
  if (process.env.DATABASE_URL || process.env.NODE_ENV === 'test') {
    return false;
  }
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return false;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);

    if (data.users && data.users.length > 0) {
      await db.User.bulkCreate(data.users, { validate: false });
    }
    if (data.sports && data.sports.length > 0) {
      await db.Sport.bulkCreate(data.sports, { validate: false });
    }
    if (data.sessions && data.sessions.length > 0) {
      await db.Session.bulkCreate(data.sessions, { validate: false });
    }
    if (data.participants && data.participants.length > 0) {
      await db.SessionParticipant.bulkCreate(data.participants, { validate: false });
    }
    return true;
  } catch (err) {
    console.warn('[Persistence] Warning loading local database:', err.message);
    return false;
  }
}

let saveTimeout = null;
function scheduleSave(db) {
  if (process.env.DATABASE_URL || process.env.NODE_ENV === 'test') return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDatabase(db).catch(() => {});
  }, 250);
}

function attachHooks(db) {
  if (process.env.DATABASE_URL || process.env.NODE_ENV === 'test') return;
  const models = [db.User, db.Sport, db.Session, db.SessionParticipant];
  models.forEach((model) => {
    if (model) {
      model.addHook('afterCreate', () => scheduleSave(db));
      model.addHook('afterUpdate', () => scheduleSave(db));
      model.addHook('afterDestroy', () => scheduleSave(db));
      model.addHook('afterBulkCreate', () => scheduleSave(db));
      model.addHook('afterBulkUpdate', () => scheduleSave(db));
      model.addHook('afterBulkDestroy', () => scheduleSave(db));
    }
  });
}

function clearDatabase() {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
}

module.exports = {
  DATA_FILE,
  saveDatabase,
  loadDatabase,
  scheduleSave,
  attachHooks,
  clearDatabase
};
