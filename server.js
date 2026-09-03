const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// In-memory fallback leaderboard when MongoDB is not connected
let inMemoryScores = [
  { name: 'WordMaster', skillScore: 42, smartScore: 180, total: 222 },
  { name: 'Lexicon', skillScore: 35, smartScore: 150, total: 185 },
  { name: 'Speedy', skillScore: 50, smartScore: 120, total: 170 },
  { name: 'Bootcamper', skillScore: 28, smartScore: 110, total: 138 },
];

let db = null;

const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  MongoClient.connect(mongoUri)
    .then((client) => {
      console.log('Connected to MongoDB database');
      db = client.db('wordball');
    })
    .catch((err) => {
      console.warn('MongoDB connection failed, falling back to in-memory store:', err.message);
    });
} else {
  console.log('No MONGODB_URI provided; using in-memory store for leaderboard.');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/getLeaderboard', async (req, res) => {
  if (db) {
    try {
      const results = await db.collection('scores')
        .find()
        .sort({ total: -1 })
        .collation({ locale: 'en_US', numericOrdering: true })
        .toArray();
      return res.json(results);
    } catch (err) {
      console.error('Error fetching scores from DB, falling back:', err.message);
    }
  }
  // Fallback to sorted in-memory scores
  const sorted = [...inMemoryScores].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
  res.json(sorted);
});

app.post('/api/getLeaderboard', async (req, res) => {
  const newScore = req.body;
  if (!newScore || typeof newScore !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (db) {
    try {
      await db.collection('scores').insertOne(newScore);
      return res.json({ success: true });
    } catch (err) {
      console.error('Error inserting score in DB, saving in-memory:', err.message);
    }
  }

  inMemoryScores.push(newScore);
  res.json({ success: true, saved: 'in-memory' });
});

// Serve client build if present
const clientBuildPath = path.join(__dirname, 'client/build');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  const indexHtml = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('Wordball server running. Run client with `npm run dev --prefix client`');
    }
  });
});

app.listen(port, () => console.log(`Wordball server listening on port ${port}`));
