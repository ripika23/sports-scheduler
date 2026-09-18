module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'Please sign in to access this page.');
    return res.redirect('/auth/login');
  },

  isAdmin: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      // If request is JSON / API / Test
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }
      req.flash('error', 'Access denied. Admin privileges required.');
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have administrative privileges to access this page.',
        user: req.user
      });
    }
    req.flash('error', 'Please sign in as an Administrator.');
    return res.redirect('/auth/login');
  },

  ensureGuest: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.redirect('/dashboard');
    }
    return next();
  }
};
