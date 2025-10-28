const router = require('express').Router();
const sendMail = require('../middleware/sendMail'); // Updated import
const { User, validate } = require('../models/user');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  try {
    console.log('POST /api/users - headers:', req.headers['content-type']);
    console.log('POST /api/users - body:', req.body);

    // Validate user input
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { email } = req.body;
    if (!email) return res.status(400).send({ message: 'Email is required' });

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).send({ message: 'The email entered already exists!' });

    // Hash password
    const SALT_ROUNDS = Number(process.env.SALT) || 10;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create user
    const newUser = await new User({ ...req.body, password: hashedPassword }).save();

    // Generate auth token
    const token = newUser.generateAuthToken();
    const maxAge = 7 * 24 * 60 * 60 * 1000;

    // Set cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge,
    };
    res.cookie('token', token, cookieOptions);

    // --- Send welcome email, but do NOT block registration if email fails ---
    try {
      await sendMail(
        newUser.email,
        'Golden Swift, Your All-in-One Wallet',
        `Welcome to Golden Swift Wallet, ${newUser.firstName} ${newUser.lastName}. Please verify your email to access your dashboard.`,
        'Verify Account',
        `${process.env.FRONTEND_URL}/verify-account?userId=${newUser._id}`
      );
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError.message);
    }

    return res.status(201).send({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
      },
    });
  } catch (error) {
    console.error('Internal Server Error Details:', error);
    return res.status(500).send({
      message: 'Server error while creating account. Check logs for details.',
    });
  }
});

module.exports = router;
