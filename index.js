// index.js
const express   = require('express');
const path      = require('path');
const Database  = require('better-sqlite3');

// open (or create) SQLite database
const db = new Database(path.join(__dirname, 'data.db'));

const app = express();
app.use(express.json());

// Serve your frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Check ───────────────────────────────────────────────────────────────
// Railway will probe GET / to verify your app is alive.
// Static middleware will serve your index.html at '/', which works,
// but we can explicitly respond here if you prefer:
app.get('/', (req, res) => {
  res.send('OK');
});

// ─── Authentication ──────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false });
  }

  // on success, send back the role
  res.json({ success: true, role: user.role });
});

// ─── Attendance ────────────────────────────────────────────────────────────────
// submit attendance
app.post('/api/attendance', (req, res) => {
  const { doctorName, doctorId, status } = req.body;
  if (!doctorName || !doctorId || !status) return res.status(400).json({ success: false });

  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const info = db.prepare(
    'INSERT INTO attendance (doctorName, doctorId, status, timestamp) VALUES (?, ?, ?, ?)'
  ).run(doctorName, doctorId, status, ts);

  res.json({ success: true, id: info.lastInsertRowid });
});

// fetch attendance (optional `?status=`)
app.get('/api/attendance', (req, res) => {
  const { status } = req.query;
  const stmt = status
    ? db.prepare('SELECT * FROM attendance WHERE status = ? ORDER BY id DESC')
    : db.prepare('SELECT * FROM attendance ORDER BY id DESC');

  res.json(stmt.all(status));
});

// ─── Inventory ────────────────────────────────────────────────────────────────
app.get('/api/inventory', (_, res) => {
  const items = db.prepare('SELECT * FROM inventory').all();
  res.json(items);
});

// ─── Resource Requests ─────────────────────────────────────────────────────────
// submit a new request
app.post('/api/resource-requests', (req, res) => {
  const { itemName, quantity, requester } = req.body;
  if (!itemName || quantity == null || !requester) return res.status(400).json({ success: false });

  const info = db.prepare(
    'INSERT INTO resourceRequests (itemName, quantity, requester, status) VALUES (?, ?, ?, ?)'
  ).run(itemName, quantity, requester, 'Pending');

  res.json({ success: true, id: info.lastInsertRowid });
});

// fetch all requests
app.get('/api/resource-requests', (_, res) => {
  const rows = db.prepare('SELECT * FROM resourceRequests ORDER BY id DESC').all();
  res.json(rows);
});

// approve or reject
app.post('/api/resource-requests/approve', (req, res) => {
  const { id, approved } = req.body;
  if (!id || typeof approved !== 'boolean') return res.status(400).json({ success: false });

  const newStatus = approved ? 'Approved' : 'Rejected';
  db.prepare('UPDATE resourceRequests SET status = ? WHERE id = ?').run(newStatus, id);

  // If approved, also increment that item in inventory:
  if (approved) {
    // find or insert into inventory
    const reqRow = db.prepare('SELECT * FROM resourceRequests WHERE id = ?').get(id);
    const existing = db.prepare('SELECT * FROM inventory WHERE itemName = ?').get(reqRow.itemName);

    if (existing) {
      db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?')
        .run(reqRow.quantity, existing.id);
    } else {
      db.prepare('INSERT INTO inventory (itemName, quantity) VALUES (?, ?)')
        .run(reqRow.itemName, reqRow.quantity);
    }
  }

  res.json({ success: true, message: `Request ${newStatus}` });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
// Use the PORT env var and bind to 0.0.0.0 for Railway compatibility
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
