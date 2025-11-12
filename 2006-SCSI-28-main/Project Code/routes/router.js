const express = require('express');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
    res.render('home', { 
        title: 'Home', 
        nav: { home: true }
    });
});

router.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { 
        title: 'Profile', 
        nav: { profile: true },
        user: req.session.user
    });
});

module.exports = router;
