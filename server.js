require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');
const connection = require('./db');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

//database connection
connection();
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



const allowedOrigins = [
    'http://localhost:5173', // local dev
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser requests
        // allow localhost or any vercel subdomain
        if (origin === 'http://localhost:5173' || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        console.log('Blocked by CORS:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})