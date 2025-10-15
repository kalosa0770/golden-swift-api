require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connection = require('./db');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

//database connection
connection();
// Middlewares
app.use(express.json());


// Get the current environment (Vercel sets this to 'production')
const isProduction = process.env.NODE_ENV === 'production';

// Define the allowed origin(s)
const allowedOrigin = isProduction
    // ⚠️ Replace with your actual Vercel domain (e.g., https://your-app.vercel.app)
    ? 'https://your-frontend-domain.vercel.app' 
    // Use the development port when running locally
    : 'http://localhost:5173'; 

// CORS Configuration
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    // Add allowed methods and headers that your frontend uses
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})