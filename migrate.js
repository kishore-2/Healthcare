// migrate.js
const Database = require('better-sqlite3');
const db = new Database('data.db');

// create tables
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

// seed users
const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)');
insertUser.run('kishore', '123', 'DDHS');
insertUser.run('phc1', '123', 'PHC');
insertUser.run('sub1', '123', 'Sub-Center');

// seed inventory
const insertInv = db.prepare('INSERT OR IGNORE INTO inventory (itemName, quantity) VALUES (?, ?)');
insertInv.run('Paracetamol', 100);
insertInv.run('Gloves', 200);

// seed attendance records (for testing)
const insertAtt = db.prepare('INSERT OR IGNORE INTO attendance (doctorName, doctorId, status, timestamp) VALUES (?, ?, ?, ?)');
const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
insertAtt.run('Dr. Smith', 'D001', 'P', now);
insertAtt.run('Dr. Jones', 'D002', 'AB', now);

// seed resource requests (for testing)
const insertReq = db.prepare('INSERT OR IGNORE INTO resourceRequests (itemName, quantity, requester, status) VALUES (?, ?, ?, ?)');
insertReq.run('Paracetamol', 50, 'PHC', 'Pending');
insertReq.run('Gloves', 100, 'Sub-Center', 'Pending');

console.log('Database setup and seeding complete.');
