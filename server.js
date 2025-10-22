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



const allowedOrigins = [
    'http://localhost:5173', // local development origin
    'https://golden-swift-bank.vercel.app/' // production origin
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); 
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true 
}));
// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})