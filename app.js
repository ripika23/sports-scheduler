require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const csrfProtection = require('./middleware/csrf');

// Import Route Handlers
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const sportRoutes = require('./routes/sportRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.set('trust proxy', 1);

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body & Cookie Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sports_scheduler_super_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: 'auto',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Flash Messages
app.use(flash());

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Global Template Variables (must precede CSRF so error rendering has full locals)
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.currentPath = req.path || '';
  res.locals.formatDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && d.includes('-') && d.length <= 10) return d;
    try {
      const dateObj = new Date(d);
      return isNaN(dateObj.getTime()) ? String(d) : dateObj.toISOString().split('T')[0];
    } catch {
      return String(d);
    }
  };
  next();
});

// CSRF Protection
app.use(csrfProtection);

// Mount Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/sports', sportRoutes);
app.use('/sessions', sessionRoutes);
app.use('/reports', reportRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The requested page or resource could not be found.',
    user: req.user || null
  });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  res.status(status).render('error', {
    title: `Error ${status}`,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred on the server.' 
      : (err.message || 'Server error'),
    user: req.user || null
  });
});

module.exports = app;
