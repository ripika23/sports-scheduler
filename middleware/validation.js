const { Sport } = require('../models');

module.exports = {
  validateSignup: (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || name.trim().length === 0) {
      errors.push('Name is required and cannot be blank.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push('A valid email address is required.');
    }

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }

    if (errors.length > 0) {
      req.flash('error', errors.join(' '));
      return res.redirect('/auth/signup');
    }

    next();
  },

  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || email.trim().length === 0) {
      errors.push('Email address is required.');
    }

    if (!password || password.trim().length === 0) {
      errors.push('Password is required.');
    }

    if (errors.length > 0) {
      req.flash('error', errors.join(' '));
      return res.redirect('/auth/login');
    }

    next();
  },

  validateSport: async (req, res, next) => {
    const { sportName } = req.body;
    const sportId = req.params.id;
    const errors = [];

    if (!sportName || sportName.trim().length === 0) {
      errors.push('Sport name cannot be blank.');
    } else {
      const trimmedName = sportName.trim();
      const existing = await Sport.findOne({
        where: Sport.sequelize.where(
          Sport.sequelize.fn('lower', Sport.sequelize.col('sportName')),
          trimmedName.toLowerCase()
        )
      });

      if (existing && (!sportId || existing.id !== parseInt(sportId, 10))) {
        errors.push(`A sport named "${trimmedName}" already exists.`);
      }
    }

    if (errors.length > 0) {
      req.flash('error', errors.join(' '));
      return res.redirect(sportId ? `/sports/${sportId}/edit` : '/sports/new');
    }

    next();
  },

  validateSession: (req, res, next) => {
    const { sportId, sessionTitle, venue, sessionDate, sessionTime, additionalPlayersNeeded } = req.body;
    const errors = [];

    if (!sportId) {
      errors.push('Please select a sport for this session.');
    }

    if (!sessionTitle || sessionTitle.trim().length === 0) {
      errors.push('Session title cannot be blank.');
    }

    if (!venue || venue.trim().length === 0) {
      errors.push('Venue location cannot be blank.');
    }

    if (!sessionDate) {
      errors.push('Session date is required.');
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (sessionDate < today) {
        errors.push('Session date cannot be in the past.');
      }
    }

    if (!sessionTime || sessionTime.trim().length === 0) {
      errors.push('Session time is required.');
    }

    const playersCount = parseInt(additionalPlayersNeeded, 10);
    if (isNaN(playersCount) || playersCount < 0) {
      errors.push('Additional players needed must be 0 or a positive integer.');
    }

    if (errors.length > 0) {
      req.flash('error', errors.join(' '));
      return res.redirect('/sessions/new');
    }

    next();
  },

  validateCancellation: (req, res, next) => {
    const { cancellationReason } = req.body;
    const sessionId = req.params.id;

    if (!cancellationReason || cancellationReason.trim().length === 0) {
      req.flash('error', 'Cancellation reason is mandatory to cancel a session.');
      return res.redirect(`/sessions/${sessionId}`);
    }

    next();
  }
};
