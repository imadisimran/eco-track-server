const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send("Server is working")
})


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.xc8a26e.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const eco_track = client.db('eco_track')
    const challenges = eco_track.collection('challenges')
    const tips = eco_track.collection('tips')
    const events = eco_track.collection('events')
    const usersChallenge = eco_track.collection('usersChallenge')
    const impacts = eco_track.collection('impacts')

    //Get Api
    app.get('/recent-challenges', async (req, res) => {
      const cursor = challenges.find().sort({ endDate: -1 }).limit(5)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/challenges', async (req, res) => {
      const query = {}

      const startDate = req.query.startDate
      const endDate = req.query.endDate

      // if(req.query.startDate && req.query.endDate){
      //   const startDate=req.query.startDate
      //   const endDate=req.query.endDate
      //   query.startDate={$gte:startDate}
      //   query.endDate={$lte:endDate}
      // }

      // if (req.query.startDate) {
      //   query.endDate = { $gte: req.query.startDate } 
      // }

      // if (req.query.endDate) {
      //   query.startDate = { $lte: req.query.endDate }
      // }

      // SCENARIO 1: User provided BOTH dates (Strict Range)
      if (startDate && endDate) {
        // "Find challenges that start AND end within my chosen dates"
        query.startDate = { $gte: startDate };
        query.endDate = { $lte: endDate };
      }

      // SCENARIO 2: User provided ONLY ONE date (Flexible/Open-ended)
      else {
        if (startDate) {
          // "Show me challenges that are still active (haven't ended yet)"
          query.endDate = { $gte: startDate };
        }
        if (endDate) {
          // "Show me challenges that started before this date"
          query.startDate = { $lte: endDate };
        }
      }

      if (req.query.categories) {
        const categories = req.query.categories.split(',')
        // console.log(categories)
        // const query={category:{$in:categories}}
        query.category = { $in: categories }
        // const cursor=challenges.find(query)
        // const result = await cursor.toArray()
        // return res.send(result)
      }
      // console.log(req.query.startDate, req.query.endDate, req.query.categories)
      const cursor = challenges.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/challenges/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await challenges.findOne(query)
      if (!result) {
        return res.send({ message: 'Not Found' })
      }
      res.send(result)
    })

    app.get('/recent-tips', async (req, res) => {
      const cursor = tips.find().sort({ createdAt: -1 }).limit(5)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/events', async (req, res) => {
      const cursor = events.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/impacts', async (req, res) => {
      const cursor = impacts.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/user-challenges', async (req, res) => {
      const query = req.query
      const cursor1 = usersChallenge.find(query)
      const result1 = await cursor1.toArray()
      const challengeIds = result1.map(r => new ObjectId(r.challengeId))
      // console.log(challengeIds)
      // const result2=await challenges.find()
      const filter = { _id: { $in: challengeIds } }
      const cursor2 = challenges.find(filter).project({ _id: 0, title: 1, imageUrl: 1 })
      const result2 = await cursor2.toArray()
      res.send({ userChallenge: result1, challenges: result2 })
    })

    app.get('/getCategories', async (req, res) => {
      const categories = await challenges.aggregate([
        {
          $group: { _id: "$category" }
        }
      ]).toArray();

      res.send(categories)

    })

    //Post Api
    app.post('/challenges', async (req, res) => {
      const newChallenge = req.body
      const result = await challenges.insertOne(newChallenge)
      res.send(result)
    })

    app.post('/add-user-challenge', async (req, res) => {
      const info = req.body
      const result = await usersChallenge.insertOne(info)
      res.send(result)
    })

    app.post('/check-user-challenge', async (req, res) => {
      const query = req.body
      const count = await usersChallenge.countDocuments(query, { limit: 1 })
      res.send(count)
    })

    //Delete Api
    app.delete('/challenges/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await challenges.deleteOne(query)
      res.send(result)
    })

    //Update Api
    app.patch('/challenges/:id', async (req, res) => {
      const id = req.params.id
      const updatedChallenge = req.body
      const update = {
        $set: updatedChallenge
      }
      const query = { _id: new ObjectId(id) }
      const result = await challenges.updateOne(query, update)
      res.send(result)
    })

    app.patch('/challenges/join/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const update = {
        $inc: { participants: 1 }
      }
      const result = await challenges.updateOne(query, update)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`server is running at ${port}`)
})