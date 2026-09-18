const { Session, Sport, SessionParticipant } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  getReports: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      // Build date condition if filters are applied
      const sessionWhere = {};
      if (startDate && endDate) {
        sessionWhere.sessionDate = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        sessionWhere.sessionDate = {
          [Op.gte]: startDate
        };
      } else if (endDate) {
        sessionWhere.sessionDate = {
          [Op.lte]: endDate
        };
      }

      // 1. Total Sessions (in filtered range)
      const totalSessions = await Session.count({ where: sessionWhere });

      // 2. Active Sessions
      const activeSessions = await Session.count({
        where: { ...sessionWhere, status: 'active' }
      });

      // 3. Cancelled Sessions
      const cancelledSessions = await Session.count({
        where: { ...sessionWhere, status: 'cancelled' }
      });

      // 4 & 5. Sessions By Sport & Most Popular Sports
      const sports = await Sport.findAll({
        include: [
          {
            model: Session,
            as: 'sessions',
            where: sessionWhere,
            required: false,
            include: [
              {
                model: SessionParticipant,
                as: 'participants'
              }
            ]
          }
        ]
      });

      const sportsStats = sports.map((sport) => {
        const sessions = sport.sessions || [];
        const sessionCount = sessions.length;
        const activeCount = sessions.filter((s) => s.status === 'active').length;
        const cancelledCount = sessions.filter((s) => s.status === 'cancelled').length;

        // Count total participants across sessions for this sport
        let participantCount = 0;
        sessions.forEach((s) => {
          if (s.participants) {
            participantCount += s.participants.length;
          }
        });

        return {
          id: sport.id,
          sportName: sport.sportName,
          totalSessions: sessionCount,
          activeSessions: activeCount,
          cancelledSessions: cancelledCount,
          totalParticipants: participantCount
        };
      });

      // Sort by popularity (total participants, then total sessions)
      sportsStats.sort((a, b) => b.totalParticipants - a.totalParticipants || b.totalSessions - a.totalSessions);

      // 6. Total Participants overall in filtered range
      const totalParticipants = await SessionParticipant.count({
        include: [
          {
            model: Session,
            as: 'session',
            where: sessionWhere,
            required: true
          }
        ]
      });

      // Total all-time sessions for comparison
      const allTimeTotalSessions = await Session.count();

      res.render('reports/index', {
        title: 'Reporting Dashboard - Sports Scheduler',
        totalSessions,
        activeSessions,
        cancelledSessions,
        totalParticipants,
        allTimeTotalSessions,
        sportsStats,
        filters: {
          startDate: startDate || '',
          endDate: endDate || ''
        },
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }
};
