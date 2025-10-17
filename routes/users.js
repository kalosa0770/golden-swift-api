const router = require('express').Router();
const {User, validate } = require('../models/user');
const bcrypt = require('bcrypt');

router.post('/', async(req, res) => {
    try {
        const {error} = validate(req.body);
        if (error) {
            return (
                res.status(400).send({message: error.details[0].message})
            )
        }
        const user = await User.findOne({ email: req.body.email });
        if(user) {
            return res.status(409).send({message: "The email entered already exists!"})
        }
        
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // 1. Create and save the new user (store it in a variable)
        const newUser = await new User({...req.body, password: hashedPassword}).save();
        
        // 2. 🔑 GENERATE THE TOKEN using the method you defined! 🔑
        const token = newUser.generateAuthToken(); // <-- CLEANER AND USES THE FIXED METHOD

        // 3. Send the token back in the response
        res.status(201).send({
            message: "Account created successfully",
            token: token, // <--- The token is included!
            user: {
                _id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName
            }
        });
    } catch (error) {
        console.error("Internal Server Error Details:", error); 
        res.status(500).send({message: "External server error! Check server console for details."});
    }
})

module.exports = router;