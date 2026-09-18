const sequelize = require('../config/database');

const UserModel = require('./user');
const SportModel = require('./sport');
const SessionModel = require('./session');
const SessionParticipantModel = require('./sessionParticipant');

const User = UserModel(sequelize);
const Sport = SportModel(sequelize);
const Session = SessionModel(sequelize);
const SessionParticipant = SessionParticipantModel(sequelize);

// User <-> Sport
User.hasMany(Sport, { foreignKey: 'createdBy', as: 'createdSports', onDelete: 'CASCADE' });
Sport.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User <-> Session (Creation)
User.hasMany(Session, { foreignKey: 'creatorId', as: 'createdSessions', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// Sport <-> Session
Sport.hasMany(Session, { foreignKey: 'sportId', as: 'sessions', onDelete: 'CASCADE' });
Session.belongsTo(Sport, { foreignKey: 'sportId', as: 'sport' });

// Session <-> SessionParticipant <-> User
Session.hasMany(SessionParticipant, { foreignKey: 'sessionId', as: 'participants', onDelete: 'CASCADE' });
SessionParticipant.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });

User.hasMany(SessionParticipant, { foreignKey: 'userId', as: 'participations', onDelete: 'CASCADE' });
SessionParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Session.belongsToMany(User, {
  through: SessionParticipant,
  foreignKey: 'sessionId',
  otherKey: 'userId',
  as: 'joinedUsers'
});

User.belongsToMany(Session, {
  through: SessionParticipant,
  foreignKey: 'userId',
  otherKey: 'sessionId',
  as: 'joinedSessions'
});

const { attachHooks } = require('../config/localPersistence');

const db = {
  sequelize,
  User,
  Sport,
  Session,
  SessionParticipant
};

attachHooks(db);

module.exports = db;
