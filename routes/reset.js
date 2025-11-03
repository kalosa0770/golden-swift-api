const router = require('express').Router();
const { User } = require('../models/user');
const bcrypt = require('bcrypt');

// Changing password
router.post('/', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: "Email, OTP, and New password are required"});
    }

    try {

        const user = await User.findOne({ email });
        if (!user) return res.status(401).send({ message: "Email entered do not exist!" });

        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP'});
        }

        if(user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired'});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        user.resetOtp = "";
        user.resetOtpExpireAt = 0; 

        await user.save();

        return res.json({ success: true, message: 'Password has been reset successfully'});
        
        
    } catch (error) {
        return res.json({ success: false, message: error.message});
    }
});

module.exports = router;