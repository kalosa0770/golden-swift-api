const router = require('express').Router();
const { User } = require('../models/user');
const sendMail = require('../middleware/sendMail'); // Your Brevo API helper

// --- SEND VERIFICATION OTP ---
router.post('/send-verify-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAccountVerified) {
      return res.json({ success: false, message: 'Account already verified' });
    }

    // Generate random 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Hash and store OTP securely using schema method
    await user.setOtp(otp);
    await user.save();

    // Compose message
    const message = `Hello ${user.firstName}, your verification OTP is ${otp}. It expires in 24 hours.`;
    const htmlMessage = `
      <p>Hello <strong>${user.firstName}</strong>,</p>
      <p>Your account verification OTP is:</p>
      <h2 style="color:#eab308;">${otp}</h2>
      <p>This code expires in 24 hours. Please verify your account soon.</p>
    `;

    // Send OTP email
    await sendMail(user.email, 'Account Verification OTP', message, htmlMessage);

    return res.json({ success: true, message: 'Verification OTP sent successfully' });
  } catch (error) {
    console.error('send-verify-otp error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send verification OTP' });
  }
});


// --- VERIFY EMAIL OTP ---
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ success: false, message: 'Missing details' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check expiry
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    // Compare OTP using bcrypt
    const isMatch = await user.verifyOtpCode(otp);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid
    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error('verify-email error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed. Try again later.' });
  }
});

module.exports = router;
