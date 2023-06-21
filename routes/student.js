const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const Student = require("../models/student");

//GET- all students with the asked subject
router.get("/:value",async (req, res) => {
 try { const student=await Student.find({courses:req.params.value}).sort({name:1});
 res.json(student);
 } catch (error) {
  console.log(error);
  res.status(500).send("Server Error");
 }
})
//POST- add new student
router.post(
  "/",
  [
    check("name", "Please add name").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {name, email, password,courses} = req.body;

    try {
      let student = await Student.findOne({ email });

      if (student) {
        return res.status(400).json({ msg: "Student already exists" });
      }

      student = new Student({
        name,
        email,
        password,
        courses
      });

      const salt = await bcrypt.genSalt(10);

      student.password = await bcrypt.hash(password, salt);

      await student.save();

      const payload = {
        student: {
          id: student.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 3600000,
        },
        (err, token) => {
          if (err) throw err;

          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;