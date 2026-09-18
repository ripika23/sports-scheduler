const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name cannot be empty' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_user_email',
        msg: 'Email address already in use'
      },
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty' }
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'player',
      validate: {
        isIn: {
          args: [['admin', 'player']],
          msg: 'Role must be either admin or player'
        }
      }
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.passwordHash);
  };

  User.hashPassword = function(password) {
    return bcrypt.hashSync(password, 10);
  };

  return User;
};
