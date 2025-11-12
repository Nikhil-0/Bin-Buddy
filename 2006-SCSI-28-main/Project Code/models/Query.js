const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Answered'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Query = mongoose.model('Query', QuerySchema);

module.exports = Query;
