const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

// Load environment variables from .env file
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MySQL connection pool (Better for production)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "sql.freedb.tech",
  user: process.env.DB_USER || "freedb_expense_tracker_user", // e.g., expense_tracker_user
  password: process.env.DB_PASSWORD || "c2h#ds&8UYdSDPY",
  database: process.env.DB_NAME || "freedb_expense-tracker-freedb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get a promise-based interface from the pool
const promisePool = pool.promise();

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT 1 + 1 AS solution");
    res.json({ message: "Database connection successful!", solution: rows[0].solution });
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// ✅ POST: Add new expense
app.post("/api/expenses", async (req, res) => {
  try {
    const { description, amount, date, category, payment_method } = req.body;
    
    const sql = "INSERT INTO expenses (description, category, payment_method, amount, date) VALUES (?, ?, ?, ?, ?)";
    const [result] = await promisePool.execute(sql, [description, category, payment_method, amount, date]);
    
    res.json({ 
      id: result.insertId, 
      description, 
      amount, 
      date, 
      category, 
      payment_method 
    });
  } catch (err) {
    console.error("MySQL Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: Fetch all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const [results] = await promisePool.query("SELECT * FROM expenses ORDER BY date DESC");
    console.log("Fetched expenses:", results);
    res.json(results);
  } catch (err) {
    console.error("MySQL Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});