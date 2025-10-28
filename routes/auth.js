// routes/auth.js
const router = require('express').Router();
const { User } = require('../models/user');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

// --- LOGIN ROUTE ---
router.post('/', async (req, res) => {
    try {
        const { error } = validate(req.body);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(401).send({ message: "Invalid Email or Password!" });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(401).send({ message: "Invalid Email or Password!" });

        // ✅ Check if account is verified
        if (!user.isAccountVerified) {
            return res.status(403).send({ 
                message: "Please verify your email before logging in.", 
                userId: user._id 
            });
        }

        // ✅ Account verified: generate token
        const token = user.generateAuthToken();
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        const COOKIE_DOMAIN = process.env.DOMAIN || null;
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: maxAge,
        };
        if (COOKIE_DOMAIN) cookieOptions.domain = COOKIE_DOMAIN;

        res.cookie('token', token, cookieOptions);

        return res.status(200).send({
            message: "Logged in successfully",
            userId: user._id,
            userName: user.firstName,
            isAccountVerified: user.isAccountVerified
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error!" });
    }
});

// --- LOGOUT ---
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0,
    });
    res.status(200).send({ message: "Logged out successfully" });
});

// --- VERIFY SESSION ---
router.get('/verify-session', auth, async (req, res) => {
    try {
        // req.user comes from your auth middleware
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send({ message: 'User not found' });

        res.status(200).send({
            message: 'Session verified',
            isAuthenticated: true,
            userName: user.firstName,
            userId: user._id,
            isAccountVerified: user.isAccountVerified
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// --- VALIDATION ---
const validate = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    return schema.validate(data);
};

module.exports = router;
