const express = require('express');
const router = express.Router();
const {  createReminder, listReminders, addReminder, showReminderForm } = require('../controllers/reminderController');

router.get('/reminder', showReminderForm);
router.post('/reminder', createReminder);

module.exports = router;
