import express from 'express'
import {pool} from '../config/db.js'

import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router();

// Mark attendance
router.post("/mark", authenticate, authorizeRole("teacher", "admin"), async (req, res) => {
  const { studentId, classId, date, status } = req.body;
  try {
    await pool.query(
      "INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES ($1, $2, $3, $4, $5)",
      [studentId, classId, date, status, req.user.id]
    );
    res.json({ message: "Attendance marked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get class attendance
router.get("/class/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM attendance WHERE class_id=$1",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student attendance
router.get("/student/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM attendance WHERE student_id=$1",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
