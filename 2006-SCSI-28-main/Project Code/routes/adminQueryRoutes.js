const express = require('express');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const adminQueryController = require('../controllers/adminQueryController');

const router = express.Router();

router.use(ensureAuthenticated);
router.use(ensureAdmin);

router.get('/Dashboard', adminQueryController.displayAdminQueryDashboard);

router.get('/Dashboard/queryList', adminQueryController.displayUserQueries);

router.get('/Dashboard/flaggedUsers', adminQueryController.displayFlaggedUsers);

router.post('/Dashboard/queryRespond/:id', adminQueryController.respondToQuery);

router.post('/Dashboard/flaggedUsers/suspend/:id', adminQueryController.suspendUser);


module.exports = router;
