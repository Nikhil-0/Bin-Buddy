const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const userQueryController = require('../controllers/userQueryController');

const router = express.Router();

router.use(ensureAuthenticated);
router.use((req, res, next) => {
  res.locals.nav = res.locals.nav || {};
  res.locals.nav.query = true;             
  next();
});

router.get('/Dashboard', userQueryController.showDashboard);

router.get('/new', userQueryController.displayQueryForm);

router.post('/submit', userQueryController.submitQuery);

router.get('/myqueries', userQueryController.viewMyQueries);


module.exports = router;

