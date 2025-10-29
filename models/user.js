const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

// --- User Schema ---
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"]
  },
  phoneNumber: { type: String },
  password: { type: String, required: true, minlength: 6 },
  verifyOtp: { type: String, default: '' },
  verifyOtpExpireAt: { type: Number, default: 0 },
  isAccountVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: '' },
  resetOtpExpireAt: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// --- JWT Token Generator ---
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY, { expiresIn: '1d' });
};

// --- OTP Methods ---
// Hash and store OTP
userSchema.methods.setOtp = async function (otp) {
  const salt = await bcrypt.genSalt(10);
  this.verifyOtp = await bcrypt.hash(otp, salt);
  this.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
};

// Verify OTP by comparing with hashed version
userSchema.methods.verifyOtpCode = async function (inputOtp) {
  return await bcrypt.compare(inputOtp, this.verifyOtp);
};

// --- Validation Schema ---
const validate = (data) => {
  const complexityOptions = {
    min: 8,
    max: 30,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 4,
  };

  const schema = Joi.object({
    firstName: Joi.string().required().label("First name"),
    lastName: Joi.string().required().label("Last name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity(complexityOptions).required().label("Password"),
    phoneNumber: Joi.string().allow('').optional().label("Phone Number"),
  }).unknown(true);

  return schema.validate(data);
};

// --- Model Export ---
const User = mongoose.model('User', userSchema);
module.exports = { User, validate };
