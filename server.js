const express = require("express");
const helmet = require("helmet");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 10000;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

app.get("/api/health", async (req, res) => {
  if (!pool) return res.json({ ok: true, database: "not-configured", mode: "demo" });
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (e) {
    res.status(503).json({ ok: false, database: "error" });
  }
});

app.post("/api/register", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured yet." });
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: "Name, email and an 8+ character password are required." });
  try {
    const q = await pool.query(
      "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role,kyc_status,demo_balance",
      [name.trim(), email.trim().toLowerCase(), hashPassword(password)]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.code === "23505" ? "Email already registered." : "Registration failed." });
  }
});

app.post("/api/login", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured yet." });
  const { email, password } = req.body || {};
  try {
    const q = await pool.query(
      "SELECT id,name,email,role,kyc_status,demo_balance FROM users WHERE email=$1 AND password_hash=$2",
      [String(email || "").trim().toLowerCase(), hashPassword(String(password || ""))]
    );
    if (!q.rows[0]) return res.status(401).json({ error: "Invalid email or password." });
    res.json(q.rows[0]);
  } catch {
    res.status(500).json({ error: "Login failed." });
  }
});

app.get("/api/demo-account/:id", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const q = await pool.query(
      "SELECT id,name,email,role,kyc_status,demo_balance,created_at FROM users WHERE id=$1",
      [req.params.id]
    );
    if (!q.rows[0]) return res.status(404).json({ error: "User not found." });
    res.json(q.rows[0]);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.post("/api/demo-trades", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured yet." });
  const { user_id, symbol, side, volume, open_price } = req.body || {};
  if (!user_id || !symbol || !["BUY","SELL"].includes(side) || !Number(volume) || !Number(open_price))
    return res.status(400).json({ error: "Invalid demo trade." });
  try {
    const q = await pool.query(
      "INSERT INTO demo_trades(user_id,symbol,side,volume,open_price) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [user_id, symbol.toUpperCase(), side, volume, open_price]
    );
    res.status(201).json(q.rows[0]);
  } catch { res.status(400).json({ error: "Could not create demo trade." }); }
});

app.get("/api/demo-trades/:userId", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const q = await pool.query(
      "SELECT * FROM demo_trades WHERE user_id=$1 ORDER BY created_at DESC",
      [req.params.userId]
    );
    res.json(q.rows);
  } catch { res.status(500).json({ error: "Server error." }); }
});

app.get("/api/admin/users", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const q = await pool.query(
      "SELECT id,name,email,role,kyc_status,demo_balance,created_at FROM users ORDER BY id DESC"
    );
    res.json(q.rows);
  } catch { res.status(500).json({ error: "Server error." }); }
});
});app.get("/", (req, res) => {
  res.send("HR Markets is running successfully 🚀");
});
app.listen(port, () => console.log(`HR Markets listening on ${port}`));
