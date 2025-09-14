import express from 'express'
import {pool} from '../config/db.js'

import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router();

// Create class (teacher/admin)
router.post("/",authenticate,authorizeRole("admin","teacher"),  async (req, res) => {
  const { name,school_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO classes (name, school_id) VALUES ($1, $2) RETURNING *",
      [name, school_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id",authenticate,authorizeRole("admin","teacher"),  async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      "UPDATE classes SET name =$1 WHERE id=$2",
      [name,req.params.id]
    );
    res.json({
      message:"Data updated",
      status:'success'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id",authenticate,authorizeRole("admin","teacher"),  async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM classes WHERE id=$1",
      [req.params.id]
    );
    res.json({
      message:'Data deleted',
      status:'success'
    })
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

// List classes by school
router.get("/:school_id",  async (req, res) => {
  try {
    const result = await pool.query(` SELECT 
        c.id,
        c.name,
        COUNT(s.student_id) AS student_count
      FROM classes c
      LEFT JOIN student_classes s ON s.class_id = c.id
      where school_id = $1
      GROUP BY c.id, c.name
      ORDER BY c.id`,[req.params.school_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
