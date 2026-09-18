const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { isAuthenticated } = require('../middleware/auth');
const { validateSession, validateCancellation } = require('../middleware/validation');

// Specific view routes
router.get('/available', isAuthenticated, sessionController.getAvailableSessions);
router.get('/my-sessions', isAuthenticated, sessionController.getMySessions);
router.get('/joined', isAuthenticated, sessionController.getJoinedSessions);
router.get('/new', isAuthenticated, sessionController.showCreateSessionForm);

// Create session action
router.post('/', isAuthenticated, validateSession, sessionController.createSession);

// Single session detail
router.get('/:id', isAuthenticated, sessionController.getSessionDetails);

// Participant actions
router.post('/:id/join', isAuthenticated, sessionController.joinSession);
router.post('/:id/cancel', isAuthenticated, validateCancellation, sessionController.cancelSession);

module.exports = router;
