const { Session, Sport, SessionParticipant } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  getHome: (req, res) => {
    res.render('home', {
      title: 'Welcome - Sports Scheduler Platform',
      user: req.user
    });
  },

  getDashboard: async (req, res, next) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Available sessions count
      const availableCount = await Session.count({
        where: {
          status: 'active',
          sessionDate: { [Op.gte]: today },
          additionalPlayersNeeded: { [Op.gt]: 0 }
        }
      });

      // User created sessions count
      const createdCount = await Session.count({
        where: { creatorId: req.user.id }
      });

      // User joined sessions count
      const joinedCount = await SessionParticipant.count({
        where: { userId: req.user.id }
      });

      // Sports count
      const sportsCount = await Sport.count();

      // Next 3 upcoming available sessions
      const upcomingSessions = await Session.findAll({
        where: {
          status: 'active',
          sessionDate: { [Op.gte]: today },
          additionalPlayersNeeded: { [Op.gt]: 0 }
        },
        include: [{ model: Sport, as: 'sport' }],
        limit: 3,
        order: [
          ['sessionDate', 'ASC'],
          ['sessionTime', 'ASC']
        ]
      });

      res.render('dashboard', {
        title: 'Dashboard - Sports Scheduler',
        user: req.user,
        stats: {
          availableCount,
          createdCount,
          joinedCount,
          sportsCount
        },
        upcomingSessions
      });
    } catch (error) {
      next(error);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      const createdCount = await Session.count({ where: { creatorId: req.user.id } });
      const joinedCount = await SessionParticipant.count({ where: { userId: req.user.id } });

      res.render('profile', {
        title: 'User Profile - Sports Scheduler',
        user: req.user,
        stats: {
          createdCount,
          joinedCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
