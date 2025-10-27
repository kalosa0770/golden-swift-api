require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const otpRoutes = require("./routes/otp"); // ✅ only import

const app = express();

// Connect database
connection();

// Middleware (same as before)
app.use(express.json()); // ✅ This is REQUIRED to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "https://golden-swift-bank.vercel.app"],
  credentials: true,
}));

// Routes
app.use('/api/users', userRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes); // ✅ correct usage

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`listening on port ${port}`));
