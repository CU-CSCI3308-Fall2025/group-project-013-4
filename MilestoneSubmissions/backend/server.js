import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db/connect.js";
import authRoutes from "./routes/authRoutes.js"; // ← make sure this is here

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json()); // ← absolutely necessary for reading JSON bodies

// Simple test route
app.get("/", (req, res) => {
  res.redirect("../frontend/login.html");
});

// 👇 ADD THIS BELOW YOUR TEST ROUTE
app.use("/api/auth", authRoutes); // <— this enables /api/auth/register & /login

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
