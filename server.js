require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const app = express();
var cors = require("cors");
const auth = require("./middleware/auth");

connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());
// Define Routes
app.use("/api/teacher", require("./routes/teacher"));
app.use("/api/student", require("./routes/student"));
app.use("/api/studentauth", require("./routes/studentauth"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use(express.static(path.join(__dirname,"client/build")))
// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
