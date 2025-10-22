const router = require('express').Router();
const {User} = require('../models/user');
const Joi = require('joi');
const bcrypt = require('bcrypt');

router.post('/', async(req, res) => {
    console.log("LOGIN ATTEMPT RECEIVED:", req.body);
    try {
        // Validation moved outside the router logic for clarity, assuming 'validate' works.
        const {error} = validate(req.body);
        if (error) {
            return res.status(400).send({message: error.details[0].message});
        }

        // Find user by email
        const user = await User.findOne({ email: req.body.email });

        if(!user) {
            // Good security practice: return a generic message
            return res.status(401).send({ message: "Invalid Email or Password!"}) 
        }

        // CRITICAL FIX: Use 'await' to resolve the Promise to a boolean and verify the password
        const validPassword = await bcrypt.compare( 
            req.body.password, 
            user.password
        );

        if(!validPassword) {
            // Return a generic message for security, same as the user not found
            return res.status(401).send({ message: "Invalid Email or Password!"}) 
        }

        // Generate the JWT token
        const token = user.generateAuthToken(); 
        
        // 🔑 NEW: Include user details (name) in the response payload 🔑
        res.status(200).send({
            token: token, 
            message: "Logged in successfully",
            // Include the user's first name for the frontend
            userName: user.firstName, 
        });

    } catch (error) {
        console.error("Internal Server Error Details:", error);
        res.status(500).send({message: "Internal server error!"});
    }
})

const validate = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().label("Email "),
        password: Joi.string().required().label("Password")
    });
    return schema.validate(data);
}

module.exports = router;
