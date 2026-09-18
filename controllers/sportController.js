const { Sport, User, Session } = require('../models');

module.exports = {
  // List all sports (accessible to all logged-in users; admin gets management buttons)
  getAllSports: async (req, res, next) => {
    try {
      const sports = await Sport.findAll({
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Session,
            as: 'sessions',
            attributes: ['id', 'status']
          }
        ],
        order: [['sportName', 'ASC']]
      });

      res.render('sports/index', {
        title: 'Sports Catalog - Sports Scheduler',
        sports,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Form to create a new sport (Admin only)
  showCreateSportForm: (req, res) => {
    res.render('sports/create', {
      title: 'Add New Sport - Sports Scheduler',
      user: req.user
    });
  },

  // Create sport action (Admin only)
  createSport: async (req, res, next) => {
    try {
      const { sportName, description } = req.body;
      const trimmedName = sportName.trim();

      const existingSport = await Sport.findOne({
        where: Sport.sequelize.where(
          Sport.sequelize.fn('lower', Sport.sequelize.col('sportName')),
          trimmedName.toLowerCase()
        )
      });

      if (existingSport) {
        req.flash('error', `A sport named "${trimmedName}" already exists.`);
        return res.redirect('/sports/new');
      }

      await Sport.create({
        sportName: trimmedName,
        description: description ? description.trim() : '',
        createdBy: req.user.id
      });

      req.flash('success', `Sport "${trimmedName}" has been successfully added!`);
      return res.redirect('/sports');
    } catch (error) {
      req.flash('error', 'Error creating sport: ' + error.message);
      return res.redirect('/sports/new');
    }
  },

  // Form to edit a sport (Admin only)
  showEditSportForm: async (req, res, next) => {
    try {
      const sport = await Sport.findByPk(req.params.id);
      if (!sport) {
        req.flash('error', 'Sport not found.');
        return res.redirect('/sports');
      }

      res.render('sports/edit', {
        title: `Edit ${sport.sportName} - Sports Scheduler`,
        sport,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Update sport action (Admin only)
  updateSport: async (req, res, next) => {
    try {
      const { sportName, description } = req.body;
      const sport = await Sport.findByPk(req.params.id);

      if (!sport) {
        req.flash('error', 'Sport not found.');
        return res.redirect('/sports');
      }

      const trimmedName = sportName.trim();
      const existingSport = await Sport.findOne({
        where: Sport.sequelize.where(
          Sport.sequelize.fn('lower', Sport.sequelize.col('sportName')),
          trimmedName.toLowerCase()
        )
      });

      if (existingSport && existingSport.id !== sport.id) {
        req.flash('error', `Another sport with the name "${trimmedName}" already exists.`);
        return res.redirect(`/sports/${sport.id}/edit`);
      }

      sport.sportName = trimmedName;
      sport.description = description ? description.trim() : '';
      await sport.save();

      req.flash('success', `Sport "${trimmedName}" updated successfully.`);
      return res.redirect('/sports');
    } catch (error) {
      req.flash('error', 'Error updating sport: ' + error.message);
      return res.redirect(`/sports/${req.params.id}/edit`);
    }
  },

  // Delete sport action (Admin only)
  deleteSport: async (req, res, next) => {
    try {
      const sport = await Sport.findByPk(req.params.id);
      if (!sport) {
        req.flash('error', 'Sport not found.');
        return res.redirect('/sports');
      }

      const name = sport.sportName;
      await sport.destroy();

      req.flash('success', `Sport "${name}" and related sessions were successfully deleted.`);
      return res.redirect('/sports');
    } catch (error) {
      req.flash('error', 'Error deleting sport: ' + error.message);
      return res.redirect('/sports');
    }
  }
};
