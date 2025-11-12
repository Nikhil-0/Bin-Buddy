const Query = require('../models/Query');
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');

async function displayAdminQueryDashboard(req, res) {
    try {
        const totalQueries = await Query.countDocuments();
        const answeredQueries = await Query.countDocuments({ status: 'Answered' });
        const pendingQueries = await Query.countDocuments({ status: 'Pending' });

        const flaggedUsersCount = await User.countDocuments({ flagged: true });

        res.render('adminQueryDashboard', { 
            total: totalQueries, 
            answered: answeredQueries, 
            pending: pendingQueries,
            flaggedUsersCount
        });
        
    } catch (error) {
        console.error(error);
        alertMessage(req, 'error', 'There was an error fetching query statistics.');
        res.render('adminQueryDashboard', { 
            total: 0, 
            answered: 0, 
            pending: 0,
            flaggedUsersCount: 0
        });
    }
}

async function respondToQuery(req,res) { 
    const queryId = req.params.id; //get query ID from URL parameter
    const responseText = req.body.responseText; //get data from textbox
    if (!responseText) {  //error handling for empty response
        alertMessage(req, 'error', 'Response cannot be blank.');
        return res.redirect('/adminQuery/Dashboard/queryList');
    }
    try {
        await Query.findByIdAndUpdate(queryId, {   //mongoose method to find an object by its Id and update the attributes
            status: 'Answered',
            answer: responseText 
        });
        //success msg
        alertMessage(req, 'success', 'Query responded successfully!');
        res.redirect('/adminQuery/Dashboard/queryList');
    } catch (err) {  //error msg
        console.error(err);
        alertMessage(req, 'error', 'There was an error responding to the query.');
        res.redirect('/adminQuery/Dashboard/queryList');
    }
}

async function displayUserQueries(req, res) {
    try {
        let filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const queries = await Query.find(filter).lean();
        res.render('adminQueryList', {
            title: filter.status ? `${filter.status} Queries` : 'All User Queries',
            queries,
            selectedStatus: req.query.status || ''
        });
    } catch (err) {
        console.error(err);
        alertMessage(req, 'error', 'There was an error retrieving the queries.');
        res.redirect('/adminQuery/Dashboard');
    }
}

async function displayFlaggedUsers(req, res) {
  try {
    const flaggedUsers = await User.find({ flagged: true }).lean();

    res.render('flaggedUsers', {
      title: 'Flagged Users',
      flaggedUsers
    });
  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error fetching flagged users.');
    res.redirect('/adminQuery/Dashboard');
  }
}

//suspend flagged user
async function suspendUser(req, res) {
  const userId = req.params.id;

  try {
    await User.findByIdAndUpdate(userId, { 
      flagged: true
    });

    alertMessage(req, 'success', 'User has been suspended successfully.');
    res.redirect('/adminQuery/Dashboard/flaggedUsers');

  } catch (err) {
    console.error(err);
    alertMessage(req, 'error', 'There was an error suspending the user.');
    res.redirect('/adminQuery/Dashboard/flaggedUsers');
  }
}

module.exports = {
  displayAdminQueryDashboard,
  displayUserQueries,
  respondToQuery,
  displayFlaggedUsers,
  suspendUser
};