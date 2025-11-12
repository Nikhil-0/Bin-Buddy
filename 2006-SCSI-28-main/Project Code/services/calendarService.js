const cron = require('node-cron');

const reminders = [];

function addReminder(reminder) {
  reminders.push(reminder);

  const date = new Date(reminder.datetime);
  const cronTime = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;

  cron.schedule(cronTime, () => {
    console.log(`Reminder for ${reminder.user}: ${reminder.message} at ${reminder.datetime}`);
  }, {
    scheduled: true,
    timezone: "Etc/UTC"
  });
}

function getReminders() {
  return reminders;
}

module.exports = { addReminder, getReminders };
