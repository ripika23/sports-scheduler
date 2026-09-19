const passport = require('passport');
const { User } = require('../models');

module.exports = {
  showSignup: (req, res) => {
  res.render('signup', {
    title: 'Sign Up - Sports Scheduler',
    user: null,
    csrfToken: req.session.csrfToken
  });
},
  signup: async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        req.flash('error', 'An account with this email address already exists. Please log in.');
        return res.redirect('/auth/login');
      }

      const userRole = (role === 'admin') ? 'admin' : 'player';

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: User.hashPassword(password),
        role: userRole
      });

      req.login(user, (err) => {
        if (err) return next(err);
        req.flash('success', `Welcome to Sports Scheduler, ${user.name}!`);
        return res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('Signup error:', error);
      req.flash('error', 'Failed to register account: ' + (error.message || 'Unknown error'));
      return res.redirect('/auth/signup');
    }
  },
  
  showLogin: (req, res) => {
  console.log('CSRF Token:', req.session.csrfToken);

  res.render('login', {
    title: 'Sign In - Sports Scheduler',
    user: null,
    csrfToken: req.session.csrfToken
  });
},
  login: (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        req.flash('error', info && info.message ? info.message : 'Invalid email or password.');
        return res.redirect('/auth/login');
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        req.flash('success', `Welcome back, ${user.name}!`);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  },

  logout: (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.flash('success', 'You have been successfully logged out.');
      return res.redirect('/auth/login');
    });
  }
};
