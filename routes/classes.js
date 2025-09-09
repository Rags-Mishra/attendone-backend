import express from 'express'
import {pool} from '../config/db.js'

import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router();

// Create class (teacher/admin)
router.post("/", authenticate, authorizeRole("teacher", "admin"), async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO classes (name, teacher_id) VALUES ($1, $2) RETURNING *",
      [name, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add student to class
router.post("/:id/add-student", authenticate, authorizeRole("teacher", "admin"), async (req, res) => {
  const { studentId } = req.body;
  try {
    await pool.query(
      "INSERT INTO student_classes (student_id, class_id) VALUES ($1, $2)",
      [studentId, req.params.id]
    );
    res.json({ message: "Student added to class" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List classes
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM classes");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
