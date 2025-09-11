import express from 'express'
import {pool} from '../config/db.js'

import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router();

// List students by class_id
router.get("/:class_id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(` SELECT 
  u.id,
  u.name
FROM users u
INNER JOIN student_classes s 
  ON s.student_id = u.id
WHERE s.class_id = $1
ORDER BY u.id;`,[req.params.class_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(` SELECT 
        c.id,
        c.name,
        COUNT(s.student_id) AS student_count
      FROM classes c
      LEFT JOIN student_classes s ON s.class_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.id`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;