const express = require("express");
// ✅ CHANGE: We are replacing 'mysql2' with 'pg' for Postgres
const { Pool } = require("pg"); 
const cors = require("cors");

// Load environment variables from .env file
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ CHANGE: Create a Postgres connection pool for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // This one variable replaces all the MySQL ones
  ssl: {
    rejectUnauthorized: false // ✅ REQUIRED for Supabase connection
  }
});

// ✅ Test database connection (Updated Query for Postgres)
app.get("/api/test-db", async (req, res) => {
  try {
    // ✅ CHANGE: Postgres uses `SELECT 2` instead of `SELECT 1+1`
    const result = await pool.query("SELECT 2 AS solution"); 
    res.json({ message: "Database connection successful!", solution: result.rows[0].solution });
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// ✅ POST: Add new expense (Query syntax is the same, placeholders are $1, $2...)
app.post("/api/expenses", async (req, res) => {
  try {
    const { description, amount, date, category, payment_method } = req.body;
    
    // ✅ CHANGE: Use $1, $2... instead of ?. Also, 'id' is auto-generated (SERIAL) in Postgres.
    const sql = "INSERT INTO expenses (description, category, payment_method, amount, date) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const result = await pool.query(sql, [description, category, payment_method, amount, date]);
    
    // ✅ CHANGE: The inserted data is in result.rows[0]
    res.json(result.rows[0]); 
  } catch (err) {
    console.error("Postgres Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: Fetch all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    // ✅ CHANGE: The results are in result.rows
    const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
    console.log("Fetched expenses:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Postgres Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});