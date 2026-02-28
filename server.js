const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Clé API Groq (variable d'environnement Render) ────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ── Route API : proxy vers Groq ───────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt manquant' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Clé API Groq non configurée sur le serveur' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    res.json({ result: text });

  } catch (err) {
    console.error('Erreur Groq:', err);
    res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
});

// ── Fichiers statiques (public/) ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Toutes les autres routes → index.html ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CVScan Pro démarré sur le port ${PORT}`);
});
