const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SessionParticipant = sequelize.define('SessionParticipant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    team: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'session_participants',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['sessionId', 'userId'],
        name: 'unique_session_user_participation'
      }
    ]
  });

  return SessionParticipant;
};
