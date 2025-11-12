const Query = require('../models/Query');
const alertMessage = require('../helpers/messenger');
const User = require('../models/User');

function showDashboard(req, res) {
  res.render('queryDashboard', {
    user: req.session.user,
    nav: { query: true }
  });
}

function displayQueryForm(req, res) {
  res.render('queryForm', { 
    title: 'Create New Query',
    user: req.session.user, 
  });
}

async function submitQuery(req, res) {
  const { question } = req.body;  

  if (!question) {
    alertMessage(req, 'error', 'Question cannot be blank.');
    return res.redirect('/query/new');
  }

  try {
    const userId = req.session.user.id;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentQueryCount = await Query.countDocuments({
      userID: userId,
      createdAt: { $gte: oneHourAgo }
    });

    console.log(`User ${userId} has sent ${recentQueryCount} queries in the past hour`);

    if (recentQueryCount >= 5) {
      await User.findByIdAndUpdate(userId, { flagged: true });
      alertMessage(req, 'error', 'You have been flagged for sending too many queries in a short time.');
    }

    const newQuery = new Query({
      userID: userId,
      question: question,
    });

    console.log("About to save:", newQuery);
    await newQuery.save();

    alertMessage(req, 'success', 'Query created successfully!');
    res.redirect('/query/myqueries');
    
  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error submitting your query.');
    res.redirect('/query/new');
  }
}

async function viewMyQueries(req, res) {
  try {
    const queries = await Query.find({ userID: req.session.user.id }).lean();
    res.render('queryList', { title: 'My Queries', queries });
  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error retrieving your queries.');
    res.redirect('/query/queryDashboard');
  }
}

module.exports = {
  showDashboard,
  displayQueryForm,
  submitQuery,
  viewMyQueries
};
