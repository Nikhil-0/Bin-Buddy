const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    datetime: {
        type: Date,
        required: true
    },

    message:{
        type: String,
        required: true,
    }
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;