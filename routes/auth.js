// routes/auth.js
const router = require('express').Router();
const { User } = require('../models/user');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// Auth middleware (optional for protected routes)
const auth = require('../middleware/auth');

// --- LOGIN ROUTE (POST /api/auth) ---
router.post('/', async (req, res) => {
    console.log("LOGIN ATTEMPT RECEIVED:", req.body);
    try {
        // 1. Validate request body
        const { error } = validate(req.body);
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        // 2. Find user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).send({ message: "Invalid Email or Password!" });
        }

        // 3. Compare passwords
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(401).send({ message: "Invalid Email or Password!" });
        }

        // 4. Check if account is verified
        if (!user.isAccountVerified) {
            return res.status(403).send({ message: "Please verify your email before logging in." });
        }

        // 5. Generate JWT token
        const token = user.generateAuthToken();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        // 6. Set the cookie
        const COOKIE_DOMAIN = process.env.DOMAIN || null;
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: maxAge,
        };
        if (COOKIE_DOMAIN) cookieOptions.domain = COOKIE_DOMAIN;

        res.cookie('token', token, cookieOptions);

        // 7. Send successful response
        return res.status(200).send({
            message: "Logged in successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Internal Server Error Details:", error);
        return res.status(500).send({ message: "Internal server error!" });
    }
});

// --- LOGOUT ROUTE (POST /api/auth/logout) ---
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0,
    });
    res.status(200).send({ message: "Logged out successfully" });
});

// --- SESSION VERIFICATION ROUTE (GET /api/auth/verify-session) ---
router.get('/verify-session', auth, (req, res) => {
    res.status(200).send({
        isAuthenticated: true,
        firstName: req.user.firstName,
        isVerified: req.user.isAccountVerified,
    });
});

// --- VALIDATION FUNCTION ---
const validate = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().label("Password")
    });
    return schema.validate(data);
};

module.exports = router;
