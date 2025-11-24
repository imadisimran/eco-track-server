const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Setup
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.xc8a26e.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// 1. DEFINE COLLECTIONS GLOBALLY (So all routes can access them)
const eco_track = client.db('eco_track');
const challenges = eco_track.collection('challenges');
const tips = eco_track.collection('tips');
const events = eco_track.collection('events');
const usersChallenge = eco_track.collection('usersChallenge');
const impacts = eco_track.collection('impacts');

// 2. CONNECT TO DB (Best practice for Serverless)
async function connectDB() {
    // This ensures connection is alive before running queries
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
}

// 3. ROOT ROUTE
app.get('/', (req, res) => {
  res.send("Server is working");
});

// ==============================================================
//  MOVE ALL ROUTES OUTSIDE THE 'run' FUNCTION
// ==============================================================

// Get Api
app.get('/recent-challenges', async (req, res) => {
  await connectDB(); // Ensure DB is connected
  const cursor = challenges.find().sort({ endDate: -1 }).limit(5);
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/challenges', async (req, res) => {
  await connectDB();
  const query = {};
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  // SCENARIO 1: User provided BOTH dates (Strict Range)
  if (startDate && endDate) {
    query.startDate = { $gte: startDate };
    query.endDate = { $lte: endDate };
  }
  // SCENARIO 2: User provided ONLY ONE date
  else {
    if (startDate) query.endDate = { $gte: startDate };
    if (endDate) query.startDate = { $lte: endDate };
  }

  if (req.query.categories) {
    const categories = req.query.categories.split(',');
    query.category = { $in: categories };
  }

  const cursor = challenges.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/challenges/:id', async (req, res) => {
  await connectDB();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await challenges.findOne(query);
  if (!result) {
    return res.send({ message: 'Not Found' });
  }
  res.send(result);
});

app.get('/recent-tips', async (req, res) => {
  await connectDB();
  const cursor = tips.find().sort({ createdAt: -1 }).limit(5);
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/events', async (req, res) => {
  await connectDB();
  const cursor = events.find();
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/impacts', async (req, res) => {
  await connectDB();
  const cursor = impacts.find();
  const result = await cursor.toArray();
  res.send(result);
});

app.get('/user-challenges', async (req, res) => {
  await connectDB();
  const query = req.query;
  const cursor1 = usersChallenge.find(query);
  const result1 = await cursor1.toArray();
  const challengeIds = result1.map(r => new ObjectId(r.challengeId));

  const filter = { _id: { $in: challengeIds } };
  const cursor2 = challenges.find(filter).project({ _id: 0, title: 1, imageUrl: 1 });
  const result2 = await cursor2.toArray();
  res.send({ userChallenge: result1, challenges: result2 });
});

app.get('/getCategories', async (req, res) => {
  await connectDB();
  const categories = await challenges.aggregate([
    { $group: { _id: "$category" } }
  ]).toArray();
  res.send(categories);
});

// Post Api
app.post('/challenges', async (req, res) => {
  await connectDB();
  const newChallenge = req.body;
  const result = await challenges.insertOne(newChallenge);
  res.send(result);
});

app.post('/add-user-challenge', async (req, res) => {
  await connectDB();
  const info = req.body;
  const result = await usersChallenge.insertOne(info);
  res.send(result);
});

app.post('/check-user-challenge', async (req, res) => {
  await connectDB();
  const query = req.body;
  const count = await usersChallenge.countDocuments(query, { limit: 1 });
  res.send(count);
});

// Delete Api
app.delete('/challenges/:id', async (req, res) => {
  await connectDB();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await challenges.deleteOne(query);
  res.send(result);
});

// Update Api
app.patch('/challenges/:id', async (req, res) => {
  await connectDB();
  const id = req.params.id;
  const updatedChallenge = req.body;
  const update = { $set: updatedChallenge };
  const query = { _id: new ObjectId(id) };
  const result = await challenges.updateOne(query, update, { upsert: true });
  res.send(result);
});

app.patch('/challenges/join/:id', async (req, res) => {
  await connectDB();
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const update = { $inc: { participants: 1 } };
  const result = await challenges.updateOne(query, update);
  res.send(result);
});

// Standard Express Listener (optional for Vercel, but good for local)
app.listen(port, () => {
  console.log(`server is running at ${port}`);
});

// Export for Vercel
module.exports = app;