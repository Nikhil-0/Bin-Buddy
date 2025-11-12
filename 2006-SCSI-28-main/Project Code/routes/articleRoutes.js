const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  res.locals.nav = { articles: true };
  next();
});
router.get('/', (req, res) => {
    res.render('articles', { title: 'Articles' });
});
router.get('/disposal', (req, res) => {
    res.render('disposal_article', { title: 'Disposal Guidelines' });
});

router.get('/big-items', (req, res) => {
    res.render('big_article', { title: 'Big Items Disposal' });
});

router.get('/pickup-service', (req, res) => {
    res.render('pickup_article', { title: 'Pickup Service' });
});

module.exports = router;