const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
var cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");

// create express app
const app = express();

// port
const port = process.env.PORT || 5003;

// express middleware start
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
// express middleware end

// custom maiddleware start
const tokenAuthentication = (req, res, next) => {
  const token = req.cookies.apiSecretToken;

  if (!token) {
    return res.status("401").send("Unauthorized");
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status("401").send("Unauthorized");
    }

    req.tokenUserInfo = decoded;
    next();
  });
};
// custom maiddleware end

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

    // collection two
    const submittedAssignmentsCollection = database.collection(
      "submittedAssignments"
    );

    // get all assignment data from assignmentsCollection based level value
    app.get("/queryAssignments", async (req, res) => {
      const { level } = req.query;
      if (level === "") return;
      const query = { level };
      const cursor = assignmentsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // insert a new assignment in assignmentsCollection
    app.post("/assignments", async (req, res) => {
      const newAssignmentData = req.body;
      const result = await assignmentsCollection.insertOne(newAssignmentData);
      res.send(result);
    });

    // get all assignment data from assignmentsCollection
    app.get("/assignments", async (req, res) => {
      const cursor = assignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // single assignment data delete from assignmentsCollection by id
    app.delete("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });

    // get single assignment data from assignmentsCollection by id
    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });

    // single assignment data update on assignmentsCollection by id
    app.patch("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedAssignmentData = req.body;

      const updateAssignment = {
        $set: {
          ...updatedAssignmentData,
        },
      };

      const result = await assignmentsCollection.updateOne(
        filter,
        updateAssignment
      );
      res.send(result);
    });

    // submittedAssignments collection code start here

    // insert a new submitted assignment in submittedAssignmentsCollection
    app.post("/submittedAssignments", async (req, res) => {
      const submittedAssignmentData = req.body;
      const result = await submittedAssignmentsCollection.insertOne(
        submittedAssignmentData
      );
      res.send(result);
    });

    // insert and update a submitted assignment in submittedAssignmentsCollection
    app.put("/submittedAssignments/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateSubmittedAssignmentData = {
        $set: {
          ...data,
        },
      };
      const result = await submittedAssignmentsCollection.updateOne(
        filter,
        updateSubmittedAssignmentData,
        options
      );
      res.send(result);
    });

    // get all submitted assignment data from submittedAssignmentsCollection
    app.get("/submittedAssignments", async (req, res) => {
      const cursor = submittedAssignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get all submitted assignment data from submittedAssignmentsCollection query by specific user email id
    app.get(
      "/submittedAssignments/:email",
      tokenAuthentication,
      async (req, res) => {
        // token cheker for valided user start now
        if (req.tokenUserInfo.email !== req.params.email) {
          return res.status(403).send("Forbidden");
        }
        // token cheker for valided user end now

        const userEmail = req.params.email;
        const query = { submittedUserEmail: userEmail };
        const cursor = submittedAssignmentsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    // get all pending assignment data from submittedAssignmentsCollection query by assignmentStatus:'pending'
    app.get(
      "/pendingAssignments/:email",
      tokenAuthentication,
      async (req, res) => {
        // token cheker for valided user start now
        if (req.tokenUserInfo.email !== req.params.email) {
          return res.status(403).send("Forbidden");
        }
        // token cheker for valided user end now

        const query = { assignmentStatus: "pending" };
        const cursor = submittedAssignmentsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    // token api code start now
    // when client side user is logged then provide jwt token with this api
    app.post("/jwtToken", (req, res) => {
      const activeUserInfo = req.body;

      // console.log("login:", activeUserInfo?.email);

      const token = jwt.sign(activeUserInfo, process.env.TOKEN_SECRET, {
        expiresIn: "365d",
      });

      res
        .cookie("apiSecretToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ tokenCreated: true });
    });

    // when client side user is logout then clear token form clint side storage from cookie
    app.get("/logout", (req, res) => {
      res
        .clearCookie("apiSecretToken", { maxAge: 0 })
        .send({ tokenCleared: true });
    });
    // token api code end now

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
