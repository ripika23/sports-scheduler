const { Session, Sport, User, SessionParticipant } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  // Available Sessions view
  getAvailableSessions: async (req, res, next) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = await Session.findAll({
        where: {
          status: 'active',
          sessionDate: { [Op.gte]: today },
          additionalPlayersNeeded: { [Op.gt]: 0 }
        },
        include: [
          { model: Sport, as: 'sport' },
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: SessionParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }
        ],
        order: [
          ['sessionDate', 'ASC'],
          ['sessionTime', 'ASC']
        ]
      });

      // Fetch IDs of sessions the user has already joined
      const userParticipations = await SessionParticipant.findAll({
        where: { userId: req.user.id },
        attributes: ['sessionId']
      });
      const joinedSessionIds = new Set(userParticipations.map(p => p.sessionId));

      res.render('sessions/available', {
        title: 'Available Sessions - Sports Scheduler',
        sessions,
        joinedSessionIds,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // My Created Sessions view
  getMySessions: async (req, res, next) => {
    try {
      const sessions = await Session.findAll({
        where: { creatorId: req.user.id },
        include: [
          { model: Sport, as: 'sport' },
          { model: SessionParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] }
        ],
        order: [
          ['sessionDate', 'DESC'],
          ['sessionTime', 'DESC']
        ]
      });

      res.render('sessions/my-sessions', {
        title: 'My Created Sessions - Sports Scheduler',
        sessions,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Joined Sessions view
  getJoinedSessions: async (req, res, next) => {
    try {
      const participations = await SessionParticipant.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: Session,
            as: 'session',
            include: [
              { model: Sport, as: 'sport' },
              { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
              { model: SessionParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const sessions = participations.map(p => p.session).filter(Boolean);

      res.render('sessions/joined', {
        title: 'Joined Sessions - Sports Scheduler',
        sessions,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Form to create a session
  showCreateSessionForm: async (req, res, next) => {
    try {
      // Admin-created sports must be visible when players create sessions
      const sports = await Sport.findAll({
        order: [['sportName', 'ASC']]
      });

      if (sports.length === 0) {
        req.flash('error', 'No sports have been created yet. Please wait for an administrator to add sports.');
        return res.redirect('/dashboard');
      }

      const today = new Date().toISOString().split('T')[0];

      res.render('sessions/create', {
        title: 'Schedule a Sport Session - Sports Scheduler',
        sports,
        today,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Create session action
  createSession: async (req, res, next) => {
    try {
      const {
        sportId,
        sessionTitle,
        venue,
        sessionDate,
        sessionTime,
        teamAPlayers,
        teamBPlayers,
        additionalPlayersNeeded
      } = req.body;

      const session = await Session.create({
        sportId: parseInt(sportId, 10),
        creatorId: req.user.id,
        sessionTitle: sessionTitle.trim(),
        venue: venue.trim(),
        sessionDate,
        sessionTime: sessionTime.trim(),
        teamAPlayers: teamAPlayers ? teamAPlayers.trim() : '',
        teamBPlayers: teamBPlayers ? teamBPlayers.trim() : '',
        additionalPlayersNeeded: parseInt(additionalPlayersNeeded, 10) || 0,
        status: 'active'
      });

      req.flash('success', 'Sports session created successfully!');
      return res.redirect(`/sessions/${session.id}`);
    } catch (error) {
      req.flash('error', 'Failed to create session: ' + error.message);
      return res.redirect('/sessions/new');
    }
  },

  // Detailed view of a single session
  getSessionDetails: async (req, res, next) => {
    try {
      const session = await Session.findByPk(req.params.id, {
        include: [
          { model: Sport, as: 'sport' },
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          {
            model: SessionParticipant,
            as: 'participants',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
          }
        ]
      });

      if (!session) {
        req.flash('error', 'Session not found.');
        return res.redirect('/sessions/available');
      }

      const today = new Date().toISOString().split('T')[0];
      const isPast = session.sessionDate < today;
      const isCreator = session.creatorId === req.user.id;
      const hasJoined = session.participants.some(p => p.userId === req.user.id);
      const isFull = session.additionalPlayersNeeded <= 0;

      res.render('sessions/show', {
        title: `${session.sessionTitle} - Sports Scheduler`,
        session,
        isPast,
        isCreator,
        hasJoined,
        isFull,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Join session action
  joinSession: async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      const session = await Session.findByPk(sessionId);

      if (!session) {
        req.flash('error', 'Session not found.');
        return res.redirect('/sessions/available');
      }

      // Check if session is active
      if (session.status !== 'active') {
        req.flash('error', 'This session is no longer active.');
        return res.redirect(`/sessions/${sessionId}`);
      }

      // Rule: Past sessions cannot be joined
      const today = new Date().toISOString().split('T')[0];
      if (session.sessionDate < today) {
        req.flash('error', 'Past sessions cannot be joined.');
        return res.redirect(`/sessions/${sessionId}`);
      }

      // Rule: Full sessions cannot be joined
      if (session.additionalPlayersNeeded <= 0) {
        req.flash('error', 'This session is already full. No additional slots are available.');
        return res.redirect(`/sessions/${sessionId}`);
      }

      // Rule: Users cannot join twice
      const existingParticipation = await SessionParticipant.findOne({
        where: {
          sessionId: session.id,
          userId: req.user.id
        }
      });

      if (existingParticipation) {
        req.flash('error', 'You have already joined this session.');
        return res.redirect(`/sessions/${sessionId}`);
      }

      // Decrement slot count and record participation
      await SessionParticipant.create({
        sessionId: session.id,
        userId: req.user.id
      });

      session.additionalPlayersNeeded = Math.max(0, session.additionalPlayersNeeded - 1);
      await session.save();

      req.flash('success', 'You have successfully joined this sports session!');
      return res.redirect(`/sessions/${sessionId}`);
    } catch (error) {
      req.flash('error', 'Error joining session: ' + error.message);
      return res.redirect(`/sessions/${req.params.id}`);
    }
  },

  // Cancel session action
  cancelSession: async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      const { cancellationReason } = req.body;
      const session = await Session.findByPk(sessionId);

      if (!session) {
        req.flash('error', 'Session not found.');
        return res.redirect('/sessions/my-sessions');
      }

      // Ownership authorization: Only session creator can cancel
      if (session.creatorId !== req.user.id) {
        req.flash('error', 'Unauthorized. You can only cancel sessions that you created.');
        return res.redirect(`/sessions/${sessionId}`);
      }

      // Mandatory cancellation reason
      if (!cancellationReason || cancellationReason.trim().length === 0) {
        req.flash('error', 'A valid cancellation reason is required.');
        return res.redirect(`/sessions/${sessionId}`);
      }

      session.status = 'cancelled';
      session.cancellationReason = cancellationReason.trim();
      await session.save();

      req.flash('success', 'The session has been cancelled.');
      return res.redirect(`/sessions/${sessionId}`);
    } catch (error) {
      req.flash('error', 'Error cancelling session: ' + error.message);
      return res.redirect(`/sessions/${req.params.id}`);
    }
  }
};
