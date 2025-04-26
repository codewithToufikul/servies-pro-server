const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ivo4yuq.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let services;

async function run() {
  try {
    await client.connect();
    const db = client.db("serviesPro");
    services = db.collection("servieses");
    latestWork = db.collection("latestWork");
    statusCollection = db.collection("status");
    faq = db.collection("faq");

    console.log("Connected to MongoDB");

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

run();

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/services", async (req, res) => {
  try {
    const cursor = services.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.post("/services", async (req, res) => {
  try {
    const newService = req.body;
    const result = await services.insertOne(newService);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to add service", details: error.message });
  }
});

app.delete("/services/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const result = await services.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to delete service", details: error.message });
  }
});

app.put("/services/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const editData = req.body;
    const result = await services.updateOne(
      { _id: new ObjectId(id) },
      { $set: editData }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update service", details: error.message });
  }
});

app.get("/latestWork", async (req, res) => {
  try {
    const cursor = latestWork.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.post("/latestWork", async (req, res) => {
  try {
    const newWork = req.body; // should include title, description, link, image
    const result = await latestWork.insertOne(newWork);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      error: "Failed to add project",
      details: error.message,
    });
  }
});


app.patch("/latestWork/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description } = req.body;

    const result = await latestWork.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, description } }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      error: "Failed to update project",
      details: error.message,
    });
  }
});

app.delete("/latestWork/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await latestWork.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({
      error: "Failed to delete project",
      details: error.message,
    });
  }
});


app.get("/status", async (req, res) => {
  try {
    const cursor = statusCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.put("/status/increment/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Ensure we're using a valid ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    
    // First get the current document to access the count value
    const item = await statusCollection.findOne({ _id: objectId });
    
    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }
    
    // Convert string count to number and increment
    const currentCount = parseInt(item.count) || 0;
    const newCount = currentCount + 1;
    
    // Update with the new count value
    const result = await statusCollection.updateOne(
      { _id: objectId },
      { $set: { count: newCount } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).send({ error: "Count not updated" });
    }
    
    res.send({ success: true, message: "Count incremented successfully" });
  } catch (error) {
    console.error("Error incrementing count:", error);
    res.status(500).send({ error: "Failed to increment count", details: error.message });
  }
});

// Decrement endpoint
app.put("/status/decrement/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Ensure we're using a valid ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    
    // Find the item first to check its count
    const item = await statusCollection.findOne({ _id: objectId });
    
    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }
    
    // Convert string count to number
    const currentCount = parseInt(item.count) || 0;
    
    if (currentCount <= 0) {
      return res.status(400).send({ error: "Count cannot be negative" });
    }
    
    const newCount = currentCount - 1;
    
    // Update with the new count value
    const result = await statusCollection.updateOne(
      { _id: objectId },
      { $set: { count: newCount } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).send({ error: "Count not updated" });
    }
    
    res.send({ success: true, message: "Count decremented successfully" });
  } catch (error) {
    console.error("Error decrementing count:", error);
    res.status(500).send({ error: "Failed to decrement count", details: error.message });
  }
});



app.get("/faq", async (req, res) => {
  try {
    const cursor = faq.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.post('/faq', async (req, res) => {
  const newFaq = req.body
  try {
    const result = await faq.insertOne(newFaq)
    res.send(result)
  } catch (err) {
    res.status(500).send({ error: 'Failed to add FAQ' })
  }
})

app.delete('/faq/:id', async (req, res) => {
  const id = req.params.id
  try {
    const result = await faq.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
  } catch (err) {
    res.status(500).send({ error: 'Failed to delete FAQ' })
  }
})

