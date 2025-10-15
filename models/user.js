const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const passwordComplexity = require('joi-password-complexity');
const Joi = require('joi');

// Define User Schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,

  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"]
  },
  phoneNumber: {
    type: String,
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({_id:this._is},process.env.JWTPRIVATEKEY, {expiresIn:'7d'});
    return token
}
 const User = mongoose.model('user', userSchema);

 const validate = (data) => {
    // Check your frontend rules and adjust these options as needed!
    const complexityOptions = {
        min: 8,              // At least 8 characters
        max: 30,
        lowerCase: 1,        // At least one lowercase letter
        upperCase: 1,        // At least one uppercase letter
        numeric: 1,          // At least one number
        symbol: 1,           // At least one special character
        requirementCount: 4  // Requires at least 4 of the above 5 categories
    };
    
    const schema = Joi.object({
        firstName: Joi.string().required().label("First name "),
        lastName: Joi.string().required().label("Last name "),
        email: Joi.string().email().required().label("Email "),
        
        // Use the explicit options to match frontend feedback
        password: passwordComplexity(complexityOptions).required().label("Password"), 
        
        // Add phone number to schema to prevent 400 Bad Request if sent from frontend
        phoneNumber: Joi.string().allow('').optional().label("Phone Number") 
    }).unknown(true); // You might need this if you have other unknown fields
    
    return schema.validate(data);
}

module.exports = {User, validate};
