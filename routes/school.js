import express from 'express'
import {pool} from '../config/db.js'


const router = express.Router();

// Get schools 
router.get("/",  async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM school",
    );
    res.json({data:result.rows,message:'Data fetched',status:'success'});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 export default router