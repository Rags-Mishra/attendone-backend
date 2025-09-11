import express from 'express'
import {pool} from '../config/db.js'

import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router();

// Mark attendance
router.post("/mark", authenticate, async (req, res) => {
  const { classId, date, records } = req.body;
  // attendance = [{ studentId, status }, { studentId, status }, ...]

  try {
    const values = [];
    const placeholders = records
      .map((r, i) => {
        const idx = i * 5;
        values.push(r.studentId, classId, date, r.status, req.user.id);
        return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`;
      })
      .join(", ");

    const query = `
      INSERT INTO attendance (student_id, class_id, date, status, marked_by)
      VALUES ${placeholders}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
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
// Get attendance by class id
router.get("/:class_id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM attendance WHERE class_id=$1",
      [req.params.class_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
