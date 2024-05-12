const { MongoClient, ServerApiVersion } = require("mongodb");
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

// mongodb database code start

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@clustercar.wslyx5y.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCar`;

// create mongo client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // database
    const database = client.db("raque");

    // collection one
    const assignmentsCollection = database.collection("assignments");

    // insert a new assignment in assignmentsCollection
    app.post("/assignments", async (req, res) => {
      const newAssignmentData = req.body;
      const result = await assignmentsCollection.insertOne(newAssignmentData);
      res.send(result);
    });

    // last time clear me ok. remember it
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // code
  }
}
run().catch(console.log);

// mongodb database code end

// default server path
app.get("/", (req, res) => {
  res.send("Assignments server running now");
});

app.listen(port, () => {
  console.log(`server running on the port: ${port}`);
});
