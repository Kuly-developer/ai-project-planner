const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. ሁሉንም ስራ ለማምጣት
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. የላቀ እና ተለዋዋጭ የPostgreSQL ፍለጋ (ሙሉ ቃልም ሆነ ግማሽ ቃል ይፈልጋል)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      const all = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
      return res.json(all.rows);
    }
    const result = await pool.query(
      `SELECT * FROM tasks
       WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
       OR title ILIKE $2
       OR description ILIKE $2
       ORDER BY id ASC`,
      [q, `%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. አዲስ ስራ ለመጨመር
router.post('/', async (req, res) => {
  try {
    const { title, description, project_id } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, project_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, project_id || null]
    );

    req.io.emit('taskAdded', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. የስራውን ደረጃ በቋሚነት ለመቀየር
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    req.io.emit('taskUpdated', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ስራን ከዳታቤዝ በቋሚነት ለማጥፋት (DELETE) —— እዚህ ጋር ተጨምሯል!
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    // በሪል-ታይም ለሁሉም ተጠቃሚዎች ስራው መጥፋቱን ያሳውቃል
    req.io.emit('taskDeleted', id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
