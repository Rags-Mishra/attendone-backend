import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import admin from 'firebase-admin'
const router = express.Router();
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password, role, schoolName, class_section } = req.body;
  try {
    const isExisting = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (isExisting.rows.length > 0) {
      res.json({
        message: "User with this id exists",
        status: error,
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let result = {};
    if (role === "admin") {
      const schoolResult = await pool.query(
        "INSERT INTO school (name) values ($1) returning id",
        [schoolName]
      );
      result = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [name, email, hashedPassword, role, schoolResult.rows[0].id]
      );
    } else if (role === "teacher") {
      result = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [name, email, hashedPassword, role, schoolName]
      );
    }
    else {
      result = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [name, email, hashedPassword, role, schoolName]
      );
      const student_class_result = await pool.query("INSERT INTO student_classes (student_id, class_id) VALUES ($1, $2)",
        [result.rows[0].id, class_section])
    }
    res.json({ message: "User registered", userId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Google sign in
router.post('/google', async (req, res) => {
  const { idToken, role, school_id, class_section } = req.body;

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // Check if user exists in PostgreSQL
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      // Insert new user
      
      if (role === "admin") {
        const schoolResult = await pool.query(
          "INSERT INTO school (name) values ($1) returning id",
          [school_id]
        );
        user = await pool.query(
          "INSERT INTO users (name, email, role, school_id) VALUES ($1, $2, $3, $4) RETURNING id",
          [name, email, role, schoolResult.rows[0].id]
        );
      } else if (role === "teacher") {
        user = await pool.query(
          "INSERT INTO users (name, email, role, school_id) VALUES ($1, $2, $3, $4) RETURNING id",
          [name, email, role, school_id]
        );
      }
      else{
         user = await pool.query(
        "INSERT INTO users (name, email, role, school_id) VALUES ($1, $2, $3, $4) RETURNING id",
        [name, email, role, school_id]
      );
      const student_class_result = await pool.query("INSERT INTO student_classes (student_id, class_id) VALUES ($1, $2)",
        [user.rows[0].id, class_section])
      }
    } else {
      user = user.rows[0];
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name, school_id: user.school_id },
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
      message: 'Signed in successfully',
      token: token,
      data: user.rows ? user.rows[0] : user,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid ID token' });
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
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name, school_id: user.school_id },
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
      token: token
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
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        school_id: decoded.school_id
      },
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
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
        school_id: req.user.school_id
      },
      message: "Welcome to your profile 🚀",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true, // ✅ only over HTTPS
    sameSite: "", // ✅ CSRF protection
    path: "/", // must match cookie path
  });

  return res.json({ message: "Logged out successfully" });
});
export default router;
