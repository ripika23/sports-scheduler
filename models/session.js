const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sports',
        key: 'id'
      },
      validate: {
        notNull: { msg: 'Please select a sport' }
      }
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Session title cannot be blank' }
      }
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Venue cannot be blank' }
      }
    },
    sessionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Date is required' },
        isNotPast(value) {
          if (!value) return;
          const today = new Date().toISOString().split('T')[0];
          if (value < today) {
            throw new Error('Session date cannot be in the past');
          }
        }
      }
    },
    sessionTime: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Time is required' }
      }
    },
    teamAPlayers: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    teamBPlayers: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    additionalPlayersNeeded: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Additional players needed cannot be negative'
        }
      }
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: {
          args: [['active', 'cancelled', 'completed']],
          msg: 'Invalid session status'
        }
      }
    }
  }, {
    tableName: 'sessions',
    timestamps: true
  });

  return Session;
};
