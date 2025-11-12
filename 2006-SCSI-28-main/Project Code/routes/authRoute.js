const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Query = require('../models/Query');
const { ensureAuthenticated, ensureGuest, ensureAdmin } = require('../middleware/auth');
const alertMessage = require('../helpers/messenger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/img/profiles');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${req.session.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Upload only image files.'), false);
        }
    }
});

router.get('/login', ensureGuest, (req, res) => {
    res.render('login', { title: 'Login', nav: { login: true } });
});
router.get('/register', ensureGuest, (req, res) => {
    const registerData = req.session.registerData || {};
    delete req.session.registerData;
    
    res.render('register', { 
        title: 'Register', 
        nav: { register: true },
        name: registerData.name || '',
        username: registerData.username || '',
        email: registerData.email || ''
    });
});

router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password, password2, adminCode } = req.body;


        if (!name || !username || !email || !password || !password2) {
            req.session.registerData = { name, username, email };
            alertMessage(req, 'error', 'Please fill in all fields');
            return res.redirect('/register');
        }


        if (username && username.length < 3) {
            req.session.registerData = { name, username, email };
            alertMessage(req, 'error', 'Username should be at least 3 characters');
            return res.redirect('/register');
        }

        if (password !== password2) {
            req.session.registerData = { name, username, email };
            alertMessage(req, 'error', 'Passwords do not match');
            return res.redirect('/register');
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
        if (!passwordRegex.test(password)) {
            req.session.registerData = { name, username, email };
            alertMessage(req, 'error', 'Password must be at least 6 characters and contain at least 1 number and 1 special character');
            return res.redirect('/register');
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { username: username }
            ]
        });

        if (existingUser) {
            req.session.registerData = { name, username, email };
            if (existingUser.email === email && existingUser.username === username) {
                alertMessage(req, 'error', 'Both email and username are already taken');
            } else if (existingUser.email === email) {
                alertMessage(req, 'error', 'Email is already registered');
            } else if (existingUser.username === username) {
                alertMessage(req, 'error', 'Username is already taken');
            }
            return res.redirect('/register');
        }

        let isAdmin = false;
        if (adminCode && adminCode.trim() !== '') {
            if (!process.env.ADMIN_CODE) {
                req.session.registerData = { name, username, email };
                alertMessage(req, 'error', 'Admin code is not configured on the server');
                return res.redirect('/register');
            }
            if (adminCode !== process.env.ADMIN_CODE) {
                req.session.registerData = { name, username, email };
                alertMessage(req, 'error', 'Invalid admin code');
                return res.redirect('/register');
            }
            isAdmin = true;
        }

        const newUser = new User({
            name,
            username,
            email,
            password,
            isAdmin
        });

        try {
            await newUser.save();
            alertMessage(req, 'success', 'You are now registered and can log in');
            return res.redirect('/login');
        } catch (saveError) {
            console.error('Error saving user:', saveError);
            req.session.registerData = { name, username, email };
            
            if (saveError.code === 11000) {
                if (saveError.keyPattern.email) {
                    alertMessage(req, 'error', 'Email is already registered');
                } else if (saveError.keyPattern.username) {
                    alertMessage(req, 'error', 'Username is already taken');
                } else {
                    alertMessage(req, 'error', 'User already exists');
                }
            } else {
                alertMessage(req, 'error', 'An unexpected error occured during registration.');
            }
            return res.redirect('/register');
        }

    } catch (err) {
        console.error('Registration error:', err);
        req.session.registerData = { 
            name: req.body.name, 
            username: req.body.username, 
            email: req.body.email 
        };
        alertMessage(req, 'error', 'An error occurred during registration.');
        return res.redirect('/register');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            alertMessage(req, 'danger', 'That email is not registered');
            return res.redirect('/login');
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            alertMessage(req, 'danger', 'Password incorrect');
            return res.redirect('/login');
        }

        if (user.flagged) {
            req.session.user = null;
            alertMessage(req, 'danger', 'Your account has been suspended.');
            return res.redirect('/login');
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin || false,
            profilePicture: user.profilePicture
        };

        req.session.messages = [];
        alertMessage(req, 'success', 'You are now logged in');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        alertMessage(req, 'danger', 'Error in login');
        res.redirect('/login');
    }
});


router.get('/admin/login', ensureGuest, (req, res) => {
    res.render('adminLogin', { title: 'Admin Login', nav: { login: true } });
});

router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            alertMessage(req, 'danger', 'That email is not registered');
            return res.redirect('/admin/login');
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            alertMessage(req, 'danger', 'Password incorrect');
            return res.redirect('/admin/login');
        }

        if (!user.isAdmin) {
            alertMessage(req, 'danger', 'You do not have admin privileges');
            return res.redirect('/admin/login');
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            isAdmin: true,
            profilePicture: user.profilePicture
        };
        req.session.messages = [];
        alertMessage(req, 'success', 'You are now logged in as admin');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        alertMessage(req, 'danger', 'Error in admin login');
        res.redirect('/admin/login');
    }
});

router.get('/admin/dashboard', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalQueries = await Query.countDocuments();
    const pendingQueries = await Query.countDocuments({ status: 'Pending' });
    
    const stats = {
        totalUsers,
        totalQueries,
        pendingQueries
    };
    
    res.render('adminDashboard', { 
        title: 'Admin Dashboard', 
        nav: { admin: true }, 
        user: req.session.user,
        stats
    });
});

router.get('/admin/users', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const usersData = await User.find({}).select('-password').sort({ dateJoined: -1 });
    
    const users = usersData.map(user => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        dateJoined: user.dateJoined,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
        flagged: user.flagged
    }));
    
    res.render('manageUsers', { 
        title: 'Manage Users', 
        nav: { admin: true }, 
        user: req.session.user,
        users
    });
});

router.get('/admin/users/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const userId = req.params.id;
    const userToEdit = await User.findById(userId).select('-password');
    
    if (!userToEdit) {
        alertMessage(req, 'danger', 'User not found');
        return res.redirect('/admin/users');
    }
    
    res.render('editUser', {
        title: 'Edit User',
        nav: { admin: true },
        user: req.session.user,
        userToEdit: {
            _id: userToEdit._id,
            name: userToEdit.name,
            username: userToEdit.username,
            email: userToEdit.email,
            dateJoined: userToEdit.dateJoined,
            profilePicture: userToEdit.profilePicture,
            isAdmin: userToEdit.isAdmin,
            flagged: userToEdit.flagged
        }
    });
});

router.post('/admin/users/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, username, isAdmin, flagged, profilePicture, password, confirmPassword } = req.body;
        
        const isAdminBool = isAdmin === 'on';
        const flaggedBool = flagged === 'on';
        
        const updateData = {
            name,
            username,
            profilePicture,
            isAdmin: isAdminBool,
            flagged: flaggedBool
        };
        
        const passwordProvided = password && password.trim().length > 0;
        const confirmPasswordProvided = confirmPassword && confirmPassword.trim().length > 0;
        
        if (passwordProvided || confirmPasswordProvided) {
            if (!passwordProvided || !confirmPasswordProvided) {
                alertMessage(req, 'error', 'Please fill both password fields or leave both blank');
                return res.redirect(`/admin/users/edit/${userId}`);
            }
            
            if (password !== confirmPassword) {
                alertMessage(req, 'error', 'Passwords do not match');
                return res.redirect(`/admin/users/edit/${userId}`);
            }
            

            const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
            if (!passwordRegex.test(password)) {
                alertMessage(req, 'error', 'Password must be at least 6 characters and contain at least 1 number and 1 special character');
                return res.redirect(`/admin/users/edit/${userId}`);
            }
            

            const user = await User.findById(userId);
            user.password = password;
            await user.save();
            

            await User.findByIdAndUpdate(userId, {
                name,
                username,
                profilePicture,
                isAdmin: isAdminBool,
                flagged: flaggedBool
            });
        } else {

            await User.findByIdAndUpdate(userId, updateData);
        }
        
        alertMessage(req, 'success', 'User updated successfully');
        res.redirect('/admin/users');
    } catch (err) {
        console.error('Error updating user:', err);
        alertMessage(req, 'error', 'Error updating user');
        res.redirect(`/admin/users/edit/${req.params.id}`);
    }
});


router.post('/admin/users/reset-picture/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const userId = req.params.id;
    
    await User.findByIdAndUpdate(userId, {
        profilePicture: '/img/defaultUser.jpg'
    });
    
    alertMessage(req, 'success', 'Profile picture reset to default');
    res.redirect(`/admin/users/edit/${userId}`);
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/login');
    });
});

router.post('/profile/update', upload.single('profilePicture'), async (req, res) => {
    const { name, username } = req.body;
    const userId = req.session.user.id;

    try {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            alertMessage(req, 'danger', 'Username is already taken');
            return res.redirect('/profile');
        }

        const user = await User.findById(userId);
        
        user.name = name;
        user.username = username;
        
        if (req.file) {
            
            if (user.profilePicture && user.profilePicture !== '/img/defaultUser.jpg') {
                const oldImagePath = path.join(__dirname, '../public', user.profilePicture);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                    } catch (err) {
                        console.log(err.message);
                    }
                }
            }
            
            user.profilePicture = `/img/profiles/${req.file.filename}`;
        }
        
        await user.save();


        req.session.user = {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin || false,
            profilePicture: user.profilePicture
        };

        alertMessage(req, 'success', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error('Profile update error:', err);
        
        if (err.message === 'Please upload only image files.') {
            alertMessage(req, 'danger', 'Please upload only image files');
        } else if (err.code === 'LIMIT_FILE_SIZE') {
            alertMessage(req, 'danger', 'File size too large');
        } else {
            alertMessage(req, 'danger', 'Error updating profile');
        }
        
        res.redirect('/profile');
    }
});

router.get('/changeCurrentPassword', ensureAuthenticated, (req, res) => {
    res.render('changeCurrentPassword', { title: 'Change Current Password', nav: { profile: true } });
});

router.post('/changeCurrentPassword', ensureAuthenticated, async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.user.id;
    const errors = [];
    
    try {
        const user = await User.findById(userId);

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            errors.push({ msg: 'Current password is incorrect' });
        }

        if (newPassword !== confirmNewPassword) {
            errors.push({ msg: 'New passwords do not match' });
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            errors.push({ msg: 'New password must be at least 6 characters and contain at least 1 number and 1 special character' });
        }

        if (errors.length > 0) {
            return res.render('changeCurrentPassword', {
                title: 'Change Current Password',
                nav: { profile: true },
                errors
            });
        }

        user.password = newPassword;
        await user.save();

        alertMessage(req, 'success', 'Password changed successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        alertMessage(req, 'danger', 'Error changing password');
        res.redirect('/changeCurrentPassword');
    }
});

module.exports = router;