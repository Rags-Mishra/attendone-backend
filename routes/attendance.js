import express from 'express'
import { pool } from '../config/db.js'

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
// Get attendance by school_id and date
router.get("/", async (req, res) => {
  const { school_id, date } = req.query;

  try {
    const result = await pool.query(
      `select 
        u.id as student_id, 
        u.name as student_name, 
        c.name as class_name, 
        a.status, 
        a.date 
      from student_classes sc 
      JOIN classes c on sc.class_id=c.id 
      JOIN users u on sc.student_id=u.id 
      JOIN attendance a on a.student_id=sc.student_id  
      where u.school_id=$1 and date=$2
      ORDER BY c.name`,
      [school_id, date]
    );

    if (result.rows.length === 0) {
      return res.json({ message: "No records found" });
    }

    const groupedData = {};

    result.rows.forEach((row) => {
      const key = row.class_name; // e.g. "Grade 12 - Science A"

      if (!groupedData[key]) {
        groupedData[key] = { students: [], grade:row.class_name.split(" ")[0], section:row.class_name.split(" ")[1], date:date, totalStudents:0 };
      }

      groupedData[key].students.push({
        id: row.student_id,
        name: row.student_name,
        status: row.status,
        rollNumber: row.roll_number,
      });
      groupedData[key].totalStudents =  groupedData[key].students.length
    });

    res.json(groupedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
