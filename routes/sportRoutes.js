const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sportController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { validateSport } = require('../middleware/validation');

// Catalog view is accessible to all authenticated users
router.get('/', isAuthenticated, sportController.getAllSports);

// Admin-only sport management
router.get('/new', isAuthenticated, isAdmin, sportController.showCreateSportForm);
router.post('/', isAuthenticated, isAdmin, validateSport, sportController.createSport);
router.get('/:id/edit', isAuthenticated, isAdmin, sportController.showEditSportForm);
router.post('/:id', isAuthenticated, isAdmin, validateSport, sportController.updateSport);
router.post('/:id/delete', isAuthenticated, isAdmin, sportController.deleteSport);

module.exports = router;
