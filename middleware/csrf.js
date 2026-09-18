const crypto = require('crypto');

function csrfProtection(req, res, next) {
  // Ensure session exists
  if (!req.session) {
    return next(new Error('Session required for CSRF protection'));
  }

  // Generate CSRF token if not already present in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Expose token to all templates/views
  res.locals.csrfToken = req.session.csrfToken;

  // Safe HTTP methods don't mutate state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Allow explicit bypass for programmatic test runners if specified
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-csrf'] === 'true') {
    return next();
  }

  // Extract token from body or headers
  const submittedToken =
    (req.body && req.body._csrf) ||
    req.headers['csrf-token'] ||
    req.headers['xsrf-token'] ||
    req.headers['x-csrf-token'];

  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    req.flash('error', 'Security verification failed (Invalid or expired CSRF token). Please try again.');
    return res.status(403).render('error', {
      title: 'CSRF Verification Failed',
      message: 'Your form submission failed the security verification check (CSRF). Please return and refresh the page.',
      user: req.user || null
    });
  }

  return next();
}

module.exports = csrfProtection;
