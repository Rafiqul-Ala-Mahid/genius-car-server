const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5001;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Password}@cluster0.tyz6hju.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err)
      res.status(403).send({ message: 'Forbidden access' });
    req.decoded = decoded;
    next();
  })
}

async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('carLists');
      const orderCollection = client.db('geniusCar').collection('orders');
      
      app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
        res.send({ token });
      })

      app.get('/services', async (req, res) => {
          const query = {}
          const cursor = serviceCollection.find(query);
          const services = await cursor.toArray();
          res.send(services);
      })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

      app.get('/orders', async (req, res) => {
            // const decoded = req.decoded;

            // if (decoded.email !== req.query.email) {
            //   res.status(403).send({ message: 'unauthorized access' });
            // }
            let query = {}
            if (req.query.email) {
                query = {
                    email:req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })
      app.post('/orders', async (req, res) => {
            console.log('order request', req.body);
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
        app.patch('/orders/:id', async (req, res) => {
          const id = req.params.id;
          const status = req.body.status;
          const query = { _id: new ObjectId(id) };
          const updateDoc = {
            $set: {
              status:status
            }
          }
          const result = await orderCollection.updateOne(query, updateDoc);
          res.send(result);
        })
        app.delete('/orders/:id',verifyJWT, async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await orderCollection.deleteOne(query);
          res.send(result);
        })
      
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("successfully get it!");
})

app.listen(port, () => {
    console.log(`local host running on port ${port}`);
})
