const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, ensureGuest } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validation');

router.get('/signup', ensureGuest, authController.showSignup);
router.post('/signup', ensureGuest, validateSignup, authController.signup);

router.get('/login', ensureGuest, authController.showLogin);
router.post('/login', ensureGuest, validateLogin, authController.login);

router.get('/logout', isAuthenticated, authController.logout);
router.post('/logout', isAuthenticated, authController.logout);

module.exports = router;
