// routes/auth.js (or the file defining the authentication router)

const router = require('express').Router();
const { User } = require('../models/user');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// Load the auth middleware right before the protected route definition
const auth = require('../middleware/auth'); 

// --- 1. PUBLIC LOGIN ROUTE (POST /) ---
// This route sets the cookie. It MUST NOT use the 'auth' middleware.
router.post('/', async (req, res) => {
    console.log("LOGIN ATTEMPT RECEIVED:", req.body);
    try {
        const { error } = validate(req.body);
        if (error) {
            return res.status(400).send({ message: error.details[0].message });
        }

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).send({ message: "Invalid Email or Password!" });
        }

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).send({ message: "Invalid Email or Password!" });
        }

        const token = user.generateAuthToken();
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        // Set the secure, cross-origin cookie
        const COOKIE_DOMAIN = process.env.DOMAIN || ''; 

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None', 
            maxAge: maxAge,
            
            // 💡 CRITICAL ADDITION FOR MOBILE/CROSS-SITE 💡
            // This tells the browser the cookie is valid for any subdomain of .vercel.app
            domain: COOKIE_DOMAIN // e.g., will resolve to .vercel.app or your custom domain
        });

        // Send successful response
        return res.status(200).send({
            message: "Logged in successfully",
            userName: user.firstName,
        });

    } catch (error) {
        console.error("Internal Server Error Details:", error);
        // Add a check here for specific MongoDB/validation errors if needed
        return res.status(500).send({ message: "Internal server error!" });
    }
});

// --- 2. PROTECTED SESSION VERIFICATION ROUTE (GET /verify-session) ---
// This route READS the cookie and REQUIRES the 'auth' middleware.
router.get('/verify-session', auth, (req, res) => {
    // If we reach here, the 'auth' middleware successfully verified the token from req.cookies.
    
    // Ensure the payload includes the first name from the middleware if needed,
    // or retrieve it from req.user (which is the decoded JWT payload).
    res.status(200).send({
        isAuthenticated: true,
        firstName: req.user.firstName, 
    });
});


// --- 3. LOGOUT ROUTE ---
router.post('/logout', (req, res) => {
    // Clear the token cookie by setting its value to none and maxAge to zero
    res.cookie('token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 0,
    });

    res.status(200).send({ message: "Logged out successfully" });
});


const validate = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().label("Email "),
        password: Joi.string().required().label("Password")
    });
    return schema.validate(data);
}

module.exports = router;