import express from "express";
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8000;


const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    // console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();

const db = mongoClient.db("social-dev-events");
const eventCollection = db.collection("event");


const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization
// console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({msg: 'Unauthorized!'})
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).send({msg: 'Unauthorized!'})
    }

    const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

    try {
        const {payload} = await jwtVerify(token, JWKS)
        next();
    } catch (error) {
        return res.status(500).send({msg: 'Server Error!'});
    }
};


app.post('/add-event', verifyToken, async (req, res) => {
    const data = req.body;
    const result = await eventCollection.insertOne(data);
    // console.log(result);
    res.send(result);
});


app.get('/upcoming-events', async (req, res) => {
    const result = await eventCollection.find().toArray();
    res.send(result);
});

app.get("/recent-upcoming-events", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await eventCollection
      .find({
        eventDate: { $gte: today },
      })
      .sort({ eventDate: 1 })
      .limit(6)
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Recent upcoming events error:", error);

    res.status(500).json({
      message: "Failed to fetch recent upcoming events.",
    });
  }
});


// event details API
app.get('/event/:id', verifyToken, async (req, res) => {
    const {id} = req.params;
    const result = await eventCollection.findOne({_id: new ObjectId(id)});
    res.send(result);
});


// http://localhost:8000

app.get("/", (req, res) => {
    res.send({msg: `Server is running successfully`});
});


app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});


export default app;
