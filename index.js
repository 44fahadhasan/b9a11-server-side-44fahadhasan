const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
var cors = require("cors");
require("dotenv").config();

// create express app
const app = express();

// port
const port = process.env.PORT || 5003;

// middleware start

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

// middleware end

// default server path
app.get("/", (req, res) => {
  res.send("Assignments server running now");
});

app.listen(port, () => {
  console.log(`server running on the port: ${port}`);
});
