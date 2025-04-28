// reset.js
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the existing database
const db = new Database(path.join(__dirname, 'data.db'));

try {
  console.log('Resetting the database...');

  // Delete all records
  db.exec(`
    DELETE FROM attendance;
    DELETE FROM resourceRequests;
    DELETE FROM inventory;
    DELETE FROM users;
    VACUUM;
  `);

  console.log('Database reset complete ✅');
} catch (error) {
  console.error('Error resetting database:', error.message);
} finally {
  db.close();
}
