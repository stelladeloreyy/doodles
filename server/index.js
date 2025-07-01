require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Placeholder for AI moderation (future)
async function aiModerationCheck(drawingData, text) {
  // TODO: Integrate AI moderation logic
  return { allowed: true, reason: null };
}

// Submit a new drawing
app.post('/api/drawings', async (req, res) => {
  const { drawingData, text } = req.body;
  const moderation = await aiModerationCheck(drawingData, text);
  if (!moderation.allowed) {
    return res.status(403).json({ error: 'Inappropriate content', reason: moderation.reason });
  }
  const result = await pool.query(
    'INSERT INTO drawings (drawing_data, text, created_at) VALUES ($1, $2, NOW()) RETURNING id',
    [drawingData, text]
  );
  res.json({ id: result.rows[0].id });
});

// Get all drawings
app.get('/api/drawings', async (req, res) => {
  const result = await pool.query('SELECT id, drawing_data, text, created_at FROM drawings ORDER BY created_at DESC');
  res.json(result.rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
