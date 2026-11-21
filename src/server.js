const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppass",
  database: process.env.DB_NAME || "appdb",
});

// Create the table, retrying until the DB is reachable
async function initDb(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query(
        "CREATE TABLE IF NOT EXISTS visits (id SERIAL PRIMARY KEY, visited_at TIMESTAMPTZ DEFAULT NOW())"
      );
      console.log("Database ready");
      return;
    } catch (err) {
      console.log(`DB not ready (attempt ${i}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Could not connect to database");
}

app.get("/", (req, res) => {
  res.json({ message: "Hello from a Docker container!", endpoints: ["/health", "/visits"] });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

// Each call records a visit in Postgres and returns the total
app.get("/visits", async (req, res) => {
  try {
    await pool.query("INSERT INTO visits DEFAULT VALUES");
    const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM visits");
    res.json({ total_visits: rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`Listening on port ${PORT}`)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
