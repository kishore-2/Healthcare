// index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'data.db'));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ success: false });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password || user.role !== role) {
    return res.status(401).json({ success: false });
  }
  res.json({ success: true, role: user.role });
});

// POST /api/attendance
app.post('/api/attendance', (req, res) => {
  const { doctorName, doctorId, status } = req.body;
  if (!doctorName || !doctorId || !status) {
    return res.status(400).json({ success: false });
  }
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const info = db.prepare(
    'INSERT INTO attendance (doctorName, doctorId, status, timestamp) VALUES (?, ?, ?, ?)'
  ).run(doctorName, doctorId, status, ts);
  res.json({ success: true, id: info.lastInsertRowid });
});

// GET /api/attendance
app.get('/api/attendance', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM attendance WHERE status = ? ORDER BY id DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM attendance ORDER BY id DESC').all();
  }
  res.json(rows);
});

// GET /api/inventory
app.get('/api/inventory', (req, res) => {
  const items = db.prepare('SELECT * FROM inventory').all();
  res.json(items);
});

// POST /api/resource-requests
app.post('/api/resource-requests', (req, res) => {
  const { itemName, quantity, requester } = req.body;
  if (!itemName || quantity == null || !requester) {
    return res.status(400).json({ success: false });
  }
  const info = db.prepare(
    'INSERT INTO resourceRequests (itemName, quantity, requester, status) VALUES (?, ?, ?, ?)'
  ).run(itemName, quantity, requester, 'Pending');
  res.json({ success: true, id: info.lastInsertRowid });
});

// GET /api/resource-requests
app.get('/api/resource-requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM resourceRequests ORDER BY id DESC').all();
  res.json(rows);
});

// POST /api/resource-requests/approve
app.post('/api/resource-requests/approve', (req, res) => {
  const { id, approved } = req.body;
  if (!id || typeof approved !== 'boolean') {
    return res.status(400).json({ success: false });
  }
  const status = approved ? 'Approved' : 'Rejected';
  db.prepare('UPDATE resourceRequests SET status = ? WHERE id = ?').run(status, id);
  res.json({ success: true, message: `Request ${status}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
