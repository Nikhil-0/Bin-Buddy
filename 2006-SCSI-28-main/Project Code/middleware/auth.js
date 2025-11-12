const alertMessage = require('../helpers/messenger');

const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    alertMessage(req, 'error', 'Please log in to view this resource');
    res.redirect('/login');
};

const ensureGuest = (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    res.redirect('/profile');
};

const ensureAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin) {
        return next();
    }
    alertMessage(req, 'error', 'Admin access required');
    res.redirect('/admin/login');
};

module.exports = {
    ensureAuthenticated,
    ensureGuest,
    ensureAdmin
};