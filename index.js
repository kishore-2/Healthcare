// index.js
const express  = require('express');
const path     = require('path');
const Database = require('better-sqlite3');
const db       = new Database(path.join(__dirname, 'data.db'));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* --------------------  Auth  -------------------- */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || user.password !== password) return res.status(401).json({ success: false });

  res.json({ success: true, role: user.role });
});

/* ------------------ Attendance ------------------ */
app.post('/api/attendance', (req, res) => {
  const { doctorName, doctorId, status } = req.body;
  if (!doctorName || !doctorId || !status)
    return res.status(400).json({ success: false });

  const ts   = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const info = db
    .prepare(
      'INSERT INTO attendance (doctorName, doctorId, status, timestamp) VALUES (?,?,?,?)'
    )
    .run(doctorName, doctorId, status, ts);

  res.json({ success: true, id: info.lastInsertRowid });
});

app.get('/api/attendance', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM attendance WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM attendance ORDER BY id DESC').all();

  res.json(rows);
});

/* ------------------- Inventory ------------------ */
app.get('/api/inventory', (_, res) => {
  const items = db.prepare('SELECT * FROM inventory').all();
  res.json(items);
});

/* -------------- Resource Requests --------------- */
app.post('/api/resource-requests', (req, res) => {
  const { itemName, quantity, requester } = req.body;
  if (!itemName || quantity == null || !requester)
    return res.status(400).json({ success: false });

  const info = db
    .prepare(
      'INSERT INTO resourceRequests (itemName, quantity, requester, status) VALUES (?,?,?,?)'
    )
    .run(itemName, quantity, requester, 'Pending');

  res.json({ success: true, id: info.lastInsertRowid });
});

app.get('/api/resource-requests', (_, res) => {
  const rows = db
    .prepare('SELECT * FROM resourceRequests ORDER BY id DESC')
    .all();
  res.json(rows);
});

/* ---------- Approve / Reject a request ---------- */
app.post('/api/resource-requests/approve', (req, res) => {
  const { id, approved } = req.body;
  if (!id || typeof approved !== 'boolean')
    return res.status(400).json({ success: false });

  const status = approved ? 'Approved' : 'Rejected';
  const getReq = db.prepare('SELECT * FROM resourceRequests WHERE id = ?');
  const reqRow = getReq.get(id);
  if (!reqRow) return res.status(404).json({ success: false });

  // 1. update request status
  db.prepare('UPDATE resourceRequests SET status = ? WHERE id = ?').run(status, id);

  // 2. if approved, upsert inventory
  if (approved) {
    const selInv = db.prepare('SELECT * FROM inventory WHERE itemName = ?');
    const inv    = selInv.get(reqRow.itemName);

    if (inv) {
      db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?')
        .run(reqRow.quantity, inv.id);
    } else {
      db.prepare('INSERT INTO inventory (itemName, quantity) VALUES (?, ?)')
        .run(reqRow.itemName, reqRow.quantity);
    }
  }

  res.json({ success: true, message: `Request ${status}` });
});

/* -------------------  Start up ------------------ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
