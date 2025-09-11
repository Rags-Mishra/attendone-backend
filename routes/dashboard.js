import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from 'express';
import { pool } from "../config/db.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";
const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRole("admin","teacher"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student') AS total_students,
    COUNT(a.student_id) FILTER (WHERE a.status = 'Present' AND a.date = CURRENT_DATE) AS present_today
FROM users u
LEFT JOIN attendance a 
    ON u.id = a.student_id
WHERE u.role = 'student';
`
      );
      res.json(result.rows[0])
    } catch (err) {
    res.status(500).json({ error: err.message });

    }
  }
);

export default router;
