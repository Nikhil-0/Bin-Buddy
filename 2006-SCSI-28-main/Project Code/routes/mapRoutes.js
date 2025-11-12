const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  res.locals.nav = { map: true };
  next();
});
router.get('/', (req, res) => {
    res.render('map', { 
        title: 'Find E-Waste Bins',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

module.exports = router;
