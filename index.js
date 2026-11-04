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
    console.log("You successfully connected to MongoDB!");
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
console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({msg: 'Unauthorized!'})
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).send({msg: 'Unauthorized!'})
    }

    const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'));

    try {
        const {payload} = await jwtVerify(token, JWKS)
        next();
    } catch (error) {
        return res.status(500).send({msg: 'Server Error!'});
    }
};


app.post('/add-event', async (req, res) => {
    const data = req.body;
    const result = await eventCollection.insertOne(data);
    // console.log(result);
    res.send(result);
});


app.get('/upcoming-events', async (req, res) => {
    const result = await eventCollection.find().toArray();
    res.send(result);
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
    console.log(`Server is running at http://localhost:${PORT}`);
});
