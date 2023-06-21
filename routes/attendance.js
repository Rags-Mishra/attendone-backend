const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const Attendance = require("../models/attendance");
const { async } = require("regenerator-runtime");

// GET- all attendance with the asked subject
router.get("",async (req, res) => {
 try { const attendance=await Attendance.find({}).sort({date:1});
 res.json(attendance);
 } catch (error) {
  console.log(error);
  res.status(500).send("Server Error");
 }
})
//POST- Mark attendance for that day

router.post(
  "/",
  // [
  //   check("present", "Please mark all the students").not().isEmpty(),
  //   check("absent", "Please mark all the students").not().isEmpty(),
  // ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { present, absent, course, date } = req.body;

    try {
      const attendance = new Attendance({
        present,
        absent,
        course,
        date,
      });
      await attendance.save();
      res.json(attendance);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
