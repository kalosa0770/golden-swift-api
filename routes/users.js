const router = require('express').Router();
const transporter = require('../middleware/nodemailer');
const {User, validate } = require('../models/user');
const bcrypt = require('bcrypt');

router.post('/', async(req, res) => {
    try {
        // Temp debug: log incoming body and content-type to help troubleshoot missing fields
        console.log('POST /api/users - headers:', req.headers['content-type']);
        console.log('POST /api/users - body:', req.body);
        const {error} = validate(req.body);
        if (error) {
            return res.status(400).send({message: error.details[0].message});
        }

        const email = req.body && req.body.email;
        if (!email) {
            return res.status(400).send({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (user) {
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

        const COOKIE_DOMAIN = process.env.DOMAIN || null;

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: maxAge,
        };

        // Only set domain if it's provided (empty string can lead to an invalid cookie)
        if (COOKIE_DOMAIN) cookieOptions.domain = COOKIE_DOMAIN;

        res.cookie('token', token, cookieOptions);


        //sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: newUser.email,
            subject: 'Golden Swift, Your All in One Wallet.',
            text: `Welcome to Golden Swift Wallet ${newUser.firstName} ${newUser.lastName}. Your account has been created. You can now login to access your dashboard`
        };

        await transporter.sendMail(mailOptions);

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
});



module.exports = router;