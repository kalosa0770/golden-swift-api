// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 💡 The token is now correctly accessed via the req.cookies object
    const token = req.cookies.token; 

    if (!token) {
        return res.status(401).send({ message: "Access denied. No session token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
        req.user = decoded; 
        next(); 
    } catch (ex) {
        return res.status(400).send({ message: "Invalid token." });
    }
};