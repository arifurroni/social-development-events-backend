import express from "express";
import { MongoClient } from 'mongodb';
import 'dotenv/config'
import cors from "cors";

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


app.post('/add-event', async (req, res) => {
    const data = req.body;
    
    const result = await eventCollection.insertOne(data);

    console.log(result);
    
    res.send(result);
});



// http://localhost:8000/add-event

app.get("/", (req, res) => {
    res.send({msg: `Server is running successfully`});
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
