const express = require('express');
const app=express()
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
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
    const eco_track=client.db('eco_track')
    const challenges=eco_track.collection('challenges')
    const tips=eco_track.collection('tips')
    const events=eco_track.collection('events')

    //Get Api
    app.get('/recent-challenges',async(req,res)=>{
      const cursor=challenges.find().sort({endDate:-1}).limit(5)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/challenges',async(req,res)=>{
      const cursor=challenges.find().sort({startDate:-1})
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/challenges/:id',async (req,res)=>{
      const id=req.params.id
      const query={_id:new ObjectId(id)}
      const result = await challenges.findOne(query)
      if(!result){
        return res.send({message:'Not Found'})
      }
      res.send(result)
    })

    app.get('/recent-tips',async(req,res)=>{
      const cursor=tips.find().sort({createdAt:-1}).limit(5)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/events',async(req,res)=>{
      const cursor = events.find()
      const result=await cursor.toArray()
      res.send(result)
    })

    //Post Api
    app.post('/challenges',async(req,res)=>{
      const newChallenge = req.body
      const result = await challenges.insertOne(newChallenge)
      res.send(result)
    })

    //Delete Api
    app.delete('/challenges/:id',async(req,res)=>{
      const id = req.params.id
      const query={_id:new ObjectId(id)}
      const result=await challenges.deleteOne(query)
      res.send(result)
    })

    //Update Api
    app.patch('/challenges/:id',async(req,res)=>{
      const id=req.params.id
      const updatedChallenge=req.body
      const update={
        $set: updatedChallenge
      }
      const query={_id:new ObjectId(id)}
      const result = await challenges.updateOne(query,update)
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



app.listen(port,()=>{
    console.log(`server is running at ${port}`)
})