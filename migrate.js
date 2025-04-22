// migrate.js
const Database = require('better-sqlite3');
const db = new Database('data.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY,
    doctorName TEXT,
    doctorId TEXT,
    status TEXT,
    timestamp TEXT
  );
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY,
    itemName TEXT,
    quantity INTEGER
  );
  CREATE TABLE IF NOT EXISTS resourceRequests (
    id INTEGER PRIMARY KEY,
    itemName TEXT,
    quantity INTEGER,
    requester TEXT,
    status TEXT
  );
`);

// Seed users
const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (username,password,role) VALUES (?,?,?)'
);
insertUser.run('kishore', '123', 'DDHS');
insertUser.run('phc1',    '123', 'PHC');
insertUser.run('sub1',    '123', 'Sub‑Center');

// Seed inventory
const insertInv = db.prepare(
  'INSERT OR IGNORE INTO inventory (itemName,quantity) VALUES (?,?)'
);
insertInv.run('Paracetamol', 100);
insertInv.run('Gloves',      200);

// ─── New: Seed an initial attendance record ──────────────────────────────────
const insertAtt = db.prepare(
  'INSERT OR IGNORE INTO attendance (doctorName,doctorId,status,timestamp) VALUES (?,?,?,?)'
);
// Generate current timestamp in "YYYY-MM-DD HH:MM:SS" format
const now = new Date().toISOString().slice(0,19).replace('T',' ');
insertAtt.run('kishore', '123', 'P', now);

// Log completion
console.log('Database setup and seeding complete.');
