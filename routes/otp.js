const router = require('express').Router();
const { User } = require('../models/user');
const transporter = require('../middleware/nodemailer');

// Send verification OTP
router.post('/send-verify-otp', async (req, res) => {
  try {
    console.log('POST /api/otp/send-verify-otp - body:', req.body);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAccountVerified) return res.json({ success: false, message: 'Account already verified' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      text: `Hello ${user.firstName}, your OTP is ${otp}. Verify your account using this OTP.`,
    };
    await transporter.sendMail(mailOption);

    return res.json({ success: true, message: 'Verification OTP sent' });
  } catch (error) {
    console.error('send-verify-otp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ success: false, message: 'Missing details' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.verifyOtp || user.verifyOtp !== otp) return res.json({ success: false, message: 'Invalid OTP' });
    if (user.verifyOtpExpireAt < Date.now()) return res.json({ success: false, message: 'OTP expired' });

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('verify-email error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
