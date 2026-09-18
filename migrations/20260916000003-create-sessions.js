'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sportId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sessionTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      venue: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sessionDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      sessionTime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      teamAPlayers: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      teamBPlayers: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      additionalPlayersNeeded: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cancellationReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('sessions');
  }
};
