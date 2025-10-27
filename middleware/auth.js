const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

module.exports = async function (req, res, next) {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.header('Authorization')) {
        const authHeader = req.header('Authorization');
        if (authHeader.startsWith('Bearer ')) token = authHeader.replace('Bearer ', '');
        else token = authHeader;
    }

    if (!token) return res.status(401).send({ message: 'Access denied. Login again.' });

    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
        
        // Fetch user from DB
        const user = await User.findById(decoded._id);
        if (!user) return res.status(401).send({ message: 'User not found.' });

        // Optional: check if account is verified
        if (!user.isAccountVerified) {
            return res.status(403).send({ message: 'Account not verified. Please verify your email.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(400).send({ message: error.message });
    }
};
