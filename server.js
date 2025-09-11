import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import attendanceRoutes from "./routes/attendance.js";
import dashboardRoutes from "./routes/dashboard.js";
import studentRoutes from "./routes/students.js";
dotenv.config();
const app = express();
app.use(cookieParser());
app.use(cors({
    origin: "https://attendone.netlify.app/", // frontend URL
    credentials: true,               // allow cookies/Authorization headers
  }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/classes", classRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/students", studentRoutes);
app.use("/dashboard", dashboardRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Attendance API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
