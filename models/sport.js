const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sport = sequelize.define('Sport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sportName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_sport_name',
        msg: 'A sport with this name already exists'
      },
      validate: {
        notEmpty: { msg: 'Sport name cannot be blank' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'sports',
    timestamps: true
  });

  return Sport;
};
