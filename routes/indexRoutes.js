const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', userController.getHome);
router.get('/dashboard', isAuthenticated, userController.getDashboard);
router.get('/profile', isAuthenticated, userController.getProfile);

module.exports = router;
