require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const { parseHtml } = require('./src/htmlParser');
const { generateBdd } = require('./src/bddGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── Multer – memory storage, HTML files only ──────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    const allowed = ['.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only HTML files are accepted (.html / .htm)'));
    }
  },
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/parse
 * Accepts a single HTML file upload and returns the structured JSON.
 */
app.post('/api/parse', upload.single('htmlFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No HTML file uploaded.' });
    }

    const html = req.file.buffer.toString('utf-8');
    const pageJson = parseHtml(html);

    return res.json({ success: true, data: pageJson });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/generate-bdd
 * Accepts a single HTML file upload, parses it, then generates BDD with AI.
 * Optionally accepts an OpenAI API key in the request body field `apiKey`.
 */
app.post('/api/generate-bdd', upload.single('htmlFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No HTML file uploaded.' });
    }

    const html = req.file.buffer.toString('utf-8');
    const pageJson = parseHtml(html);

    // apiKey may be passed from the client (stored only for this request)
    const apiKey = (req.body && req.body.apiKey) || process.env.OPENAI_API_KEY;
    const model = (req.body && req.body.model) || 'gpt-4o-mini';

    const bddScenarios = await generateBdd(pageJson, apiKey, model);

    return res.json({ success: true, data: pageJson, bdd: bddScenarios });
  } catch (err) {
    return res.status(err.message.includes('API key') ? 401 : 500).json({
      error: err.message,
    });
  }
});

// ── Multer error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BDD Generation server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
