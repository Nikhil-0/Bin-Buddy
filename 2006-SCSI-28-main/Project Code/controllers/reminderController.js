const Reminder = require('../models/Reminder');
const mongoose = require('mongoose');
const alertMessage = require('../helpers/messenger');

function showDashboard(req, res) {
  res.render('reminderDashboard', {
    user: req.session.user,
    nav: { reminder: true }
  });
}

function displayReminderForm(req, res) {
  res.render('reminderForm', {
    title: 'Create New Reminder',
    user: req.session.user
  });
}

async function submitReminder(req, res) {
  const { message, datetime } = req.body;

  if (!message || !datetime) {
    alertMessage(req, 'error', 'Message and date/time cannot be blank.');
    return res.redirect('/reminder/new');
  }

  const reminderDate = new Date(datetime);
  const currentDate = new Date();
  const maxDate = new Date('2030-12-31T23:59:59');

  if (isNaN(reminderDate.getTime())) {
    alertMessage(req, 'error', 'Invalid date format.');
    return res.redirect('/reminder/new');
  }

  if (reminderDate < currentDate) {
    alertMessage(req, 'error', 'Reminder date cannot be in the past.');
    return res.redirect('/reminder/new');
  }

  if (reminderDate > maxDate) {
    alertMessage(req, 'error', 'Reminder date cannot be beyond year 2030.');
    return res.redirect('/reminder/new');
  }

  try {
    const newReminder = new Reminder({
      userID: req.session.user.id,
      message,
      datetime
    });

    await newReminder.save();

    alertMessage(req, 'success', 'Reminder created successfully!');
    res.redirect('/reminder/myreminders');
  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error creating your reminder.');
    res.redirect('/reminder/new');
  }
}

async function viewMyReminders(req, res) {
  try {
    const reminders = await Reminder.find({ userID: req.session.user.id }).lean();
    res.render('reminderList', { title: 'My Reminders', reminders });
  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error retrieving your reminders.');
    res.redirect('/reminder/reminderDashboard');
  }
}

async function deleteReminder(req, res) {
  try {
    const reminderId = req.params.id;
    const userId = req.session.user.id;

    const deletedReminder = await Reminder.findOneAndDelete({ 
      _id: reminderId, 
      userID: userId 
    });

    if (!deletedReminder) {
      alertMessage(req, 'error', 'Reminder not found or you do not have permission to delete it.');
    } else {
      alertMessage(req, 'success', 'Reminder deleted successfully!');
    }
  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error deleting the reminder.');
  }
  
  res.redirect('/reminder/myreminders');
}

module.exports = {
  showDashboard,
  displayReminderForm,
  submitReminder,
  viewMyReminders,
  deleteReminder
};