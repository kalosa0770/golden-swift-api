const router = require('express').Router();
const {User, validate } = require('../models/user');
const bcrypt = require('bcrypt');

router.post('/', async(req, res) => {
    try {
        const {error} = validate(req.body);
        if (error) {
            return res.status(400).send({message: error.details[0].message});
        }

        const user = await User.findOne({ email: req.body.email });
        if(user) {
            return res.status(409).send({message: "The email entered already exists!"})
        }
        
        // Ensure SALT_ROUNDS is correctly defined with a fallback
        const SALT_ROUNDS = Number(process.env.SALT) || 10;
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const newUser = await new User({...req.body, password: hashedPassword}).save();
        
        // 1. Generate the JWT token
        const token = newUser.generateAuthToken(); 

        // 2. 🔑 CRITICAL FIX: Set the token as a secure, HTTP-only cookie 🔑
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days expiry

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

        // 3. Send a successful response without the token in the JSON body
        return res.status(201).send({
            message: "Account created successfully",
            user: {
                _id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName
            }
        });
        
    } catch (error) {
        console.error("Internal Server Error Details:", error); 
        return res.status(500).send({message: "External server error! Check server console for details."});
    }
})

module.exports = router;