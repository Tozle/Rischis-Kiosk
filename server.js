// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());

// Lies Render-Umgebungsvariablen
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Beispielroute: Signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Beispielroute: Produkte abrufen
app.get('/products', async (req, res) => {
  const { data, error } = await supabase.from('produkte').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// (optional) statisches Frontend bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));
