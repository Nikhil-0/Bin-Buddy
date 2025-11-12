const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const reminderController = require('../controllers/reminderController');

const router = express.Router();

router.use(ensureAuthenticated);
router.use((req, res, next) => {
  res.locals.nav = { reminder: true };
  next();
});

router.get('/reminderDashboard', reminderController.showDashboard);

router.get('/new', reminderController.displayReminderForm);

router.post('/submit', reminderController.submitReminder);

router.get('/myreminders', reminderController.viewMyReminders);

router.post('/delete/:id', reminderController.deleteReminder);

module.exports = router;