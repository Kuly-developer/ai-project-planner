const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../db');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate-tasks', async (req, res) => {
  try {
    const { goal, project_id } = req.body;
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    const prompt = `Break down this project goal into 5 actionable sub-tasks: "${goal}".
    Return ONLY a valid JSON array of objects with "title" and "description" keys. Do not include markdown formatting.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    const generatedTasks = JSON.parse(responseText);

    const savedTasks = [];
    for (const task of generatedTasks) {
      const dbResult = await pool.query(
        'INSERT INTO tasks (title, description, project_id) VALUES ($1, $2, $3) RETURNING *',
        [task.title, task.description, project_id || null]
      );
      savedTasks.push(dbResult.rows[0]);
      // በሪል-ታይም ለሁሉም ተጠቃሚዎች ወዲያውኑ ያሰራጫል
      req.io.emit('taskAdded', dbResult.rows[0]);
    }

    res.json({ message: 'AI tasks generated successfully', tasks: savedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
