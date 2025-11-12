const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const alertMessage = require('../helpers/messenger');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
    user: 'apikey', 
    pass: process.env.SENDGRID_API_KEY
    }
});

transporter.verify((error, success) => {
    if (error) {
    console.error('SMTP verification failed:', error);
    } else {
    console.log('SMTP server is ready to send emails');
    }
});

const showForgotForm = (req, res) => {
    res.render('forgotpassword');
};

async function handleForgotPassword (req, res) {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.redirect('/login');

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = Date.now() + 3600000;

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await user.save({ validateBeforeSave: false });

        const resetLink = `http://localhost:3000/resetpassword?token=${token}`;
        console.log(resetLink);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Recovery',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        }).catch(err => console.error('SendMail error:', err));

        alertMessage(req, 'success', 'Password recovery instructions have been sent to your email if it exists in our system.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error in password recovery:', error);
        res.redirect('/login');
    }
};

async function showResetForm (req, res) {
    const { token } = req.query;

    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user) return res.redirect('/forgotpassword');

    res.render('resetPassword', { token });
};

async function handleResetPassword (req, res) {
    const { token, password } = req.body;
    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user) return res.redirect('/forgotpassword');
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save( {validateBeforeSave: false});
    res.redirect('/login');
};

module.exports = {
    showForgotForm,
    handleForgotPassword,
    showResetForm,
    handleResetPassword
}