const router = require('express').Router();
const { User, validate } = require('../models/user');
const sendMail = require('../middleware/sendMail'); // Your Brevo API helper

// --- SEND VERIFICATION OTP ---
router.post('/send-verify-otp', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAccountVerified) {
      return res.json({ success: false, message: 'Account already verified' });
    }

    // Generate random 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Hash and store OTP securely using schema method
    await user.sendOtp(otp);
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

    return res.json({ success: true, message: 'Verification OTP sent successfully to you gmail inbox' });
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

router.post('/send-reset-otp', async (req, res) => {
  try {

      const { email } = req.body || {};
      
      // Basic check for existence
      if (!email) {
          return res.status(400).json({ success: false, message: 'Email is required.' });
      }

      // Basic check for format (Optional: Regex from Mongoose schema for consistency)
      // If you want to replicate the email regex check:
      const emailRegex = /.+@.+\..+/;
      if (!emailRegex.test(email)) {
          return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
      
      // 2. Find the user
      const user = await User.findOne({ email });
      if (!user) {
          // Using 404/400 status is fine
          return res.status(404).json({ success: false, message: 'Email entered does not exist!'});
      }

      // 3. Generate and store OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      user.resetOtp = otp;
      user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

      await user.save();

      // 4. Compose and Send Email (Safe because 'user' exists)
      const message = `Hello ${user.firstName}, your password reset OTP is ${otp}. It expires in 15 minutes.`;
      const htmlMessage = `
          <p>Hello <strong>${user.firstName}</strong>,</p>
          <p>Your account password reset OTP is:</p>
          <h2 style="color:#eab308;">${otp}</h2>
          <p>This code expires in 15 minutes. Please reset your password soon.</p>
      `;

      await sendMail(user.email, 'Password Reset OTP', message, htmlMessage);

      return res.json({ success: true, message: 'Password Reset OTP sent successfully to your email inbox' });

  } catch (error) {
      console.error('send-reset-otp internal error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error while sending reset OTP.'});
  }
});
module.exports = router;
