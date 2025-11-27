require("dotenv").config(); //
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("MongoDB connected!");

    const db = client.db(process.env.DB_NAME);
    const productsCollection = db.collection("products");
    const addProductCollection = db.collection("addProduct");

    // ===== GET all products =====
    app.get("/products", async (req, res) => {
      try {
        const result = await productsCollection
          .find()
          .sort({ price: -1 })
          .toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send({ error: "Failed to fetch products" });
      }
    });

    // ===== GET product by ID =====
    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await productsCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        console.error("Error fetching product by ID:", err);
        res.status(500).send({ error: "Failed to fetch product by ID" });
      }
    });

    // ===== POST new product (main products collection) =====
    app.post("/products", async (req, res) => {
      try {
        const newProduct = req.body;
        const result = await productsCollection.insertOne(newProduct);
        res.send(result);
      } catch (err) {
        console.error("Error inserting product:", err);
        res.status(500).send({ error: "Failed to insert product" });
      }
    });

    // ===== POST addProduct (protected / separate addProduct collection) =====
    app.post("/addProduct", async (req, res) => {
      try {
        const newProduct = req.body;
        const result = await addProductCollection.insertOne(newProduct);
        res.send(result);
      } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).send({ error: "Failed to add product" });
      }
    });

    // ===== GET all added products =====
    app.get("/addProduct", async (req, res) => {
      try {
        const result = await addProductCollection
          .find()
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching added products:", err);
        res.status(500).send({ error: "Failed to fetch added products" });
      }
    });

    // ===== DELETE product =====
    app.delete("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Product not found" });
        }
        res.send({ message: "Product deleted successfully" });
      } catch (err) {
        console.error("Delete error:", err);
        res.status(500).send({ error: "Failed to delete product" });
      }
    });

    // ===== Start server =====
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run();
