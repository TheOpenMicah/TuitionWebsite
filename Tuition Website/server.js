const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Import the 'path' module
const app = express();

// --- CONFIGURATION ---
// Use the PORT environment variable provided by Render, or default to 3000 for local development
const PORT = process.env.PORT || 3000;
// Use the DB_PATH environment variable for the database location, or default to a local file
const DB_PATH = process.env.DB_PATH || './responses.db';
// This is the password for viewing the responses page. CHANGE THIS to something secure!
const ADMIN_PASSWORD = 'CorrectHorseBatteryStaple'; 

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
// Serve static files (HTML, CSS, video) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE INITIALIZATION ---
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    db.run(`CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parentName TEXT,
      childAge INTEGER,
      tuitionReason TEXT,
      needs TEXT,
      otherNeeds TEXT,
      contactMethod TEXT,
      phoneNumber TEXT,
      emailAddress TEXT,
      otherContact TEXT,
      actioned INTEGER DEFAULT 0,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// --- API ROUTES ---

// API to submit a new response from the form
app.post('/api/submit', (req, res) => {
  const {
    parentName, childAge, tuitionReason, needs, otherNeeds, contactMethod, phoneNumber, emailAddress, otherContact
  } = req.body;
  db.run(
    `INSERT INTO responses (parentName, childAge, tuitionReason, needs, otherNeeds, contactMethod, phoneNumber, emailAddress, otherContact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parentName, childAge, tuitionReason, needs, otherNeeds, contactMethod, phoneNumber, emailAddress, otherContact],
    function (err) {
      if (err) {
        console.error('Database insert error:', err);
        res.status(500).json({ error: 'Failed to submit response.' });
      } else {
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// API to get all responses (now requires password)
app.post('/api/responses', (req, res) => {
  const { password } = req.body;

  // Securely check the password on the server
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  db.all('SELECT * FROM responses', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API to mark a response as actioned
app.post('/api/actioned/:id', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE responses SET actioned = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// --- CATCH-ALL ROUTE ---
// This makes sure that if a user refreshes a page, the server still sends the correct HTML file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
