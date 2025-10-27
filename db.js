// db.js
require('dotenv').config();
const mongoose = require('mongoose');

module.exports = async () => {
  const dbUri = process.env.DB;

  if (!dbUri) {
    console.error('MongoDB URI is missing! Set process.env.DB');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Atlas database successfully');
  } catch (error) {
    console.error('Could not connect to database:', error);
    process.exit(1);
  }
};
