const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const Teacher = require("../models/teacher");

// @route     POST api/teachers
// @desc      Regiter a teacher
// @access    Public
router.get("/",async (req, res) => {res.send("hola")})
router.post(
  "/",
  [
    check("name", "Please add name").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
    check("courses","Enter atleast one course").isLength({min:1})
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, courses } = req.body;

    try {
      let teacher = await Teacher.findOne({ email });

      if (teacher) {
        return res.status(400).json({ msg: "Teacher already exists" });
      }

      teacher = new Teacher({
        name,
        email,
        password,
        courses
      });

      const salt = await bcrypt.genSalt(10);

      teacher.password = await bcrypt.hash(password, salt);

      await teacher.save();

      const payload = {
        teacher: {
          id: teacher.id,
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