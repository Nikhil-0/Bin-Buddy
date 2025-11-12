const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

router.get('/forgotpassword', passwordController.showForgotForm);
router.post('/forgotpassword', passwordController.handleForgotPassword);
router.get('/resetpassword', passwordController.showResetForm);
router.post('/resetpassword', passwordController.handleResetPassword);

module.exports = router;