import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();
const REFRESH_SECRET = process.env.REFRESH_SECRET;
// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, hashedPassword, role]
    );

    res.json({ message: "User registered", userId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });
console.log("jwt",process.env.JWT_SECRET)
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name   },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name   },
      REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // only over HTTPS in production
      sameSite: "",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name:user.name
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Issue new access token
    const token = jwt.sign(
      { id: decoded.id, email: decoded.email, name:decoded.name, role:decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});
router.get("/profile", authenticate, async (req, res) => {
  try {
    res.json({
      data: { id: req.user.id, email:  req.user.email, role:  req.user.role, name:  req.user.name },
      message: "Welcome to your profile 🚀",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,       // ✅ only over HTTPS
    sameSite: "", // ✅ CSRF protection
    path: "/",          // must match cookie path
  });

  return res.json({ message: "Logged out successfully" });
});
export default router;
