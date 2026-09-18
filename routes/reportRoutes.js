const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Admin-only reports
router.get('/', isAuthenticated, isAdmin, reportController.getReports);

module.exports = router;
