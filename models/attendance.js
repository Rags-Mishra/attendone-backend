const mongoose = require("mongoose");
const AttendanceSchema = mongoose.Schema({
  present: [{ type: mongoose.Schema.Types.ObjectId, ref: "student" }],
  absent: [{ type: mongoose.Schema.Types.ObjectId, ref: "student" }],
  course: { type: String, required: true },
  date: {
    type: Date,
  },
});
module.exports = mongoose.model("attendance", AttendanceSchema);
