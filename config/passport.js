const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        if (!email || !password) {
          return done(null, false, { message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
          return done(null, false, { message: 'No user found with this email address' });
        }

        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
