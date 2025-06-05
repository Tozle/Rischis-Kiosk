const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());

// Supabase Setup mit Umgebungsvariablen
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// >>> Static Files (Frontend ausliefern)
app.use(express.static(path.join(__dirname, 'public')));

// Beispiel-API
app.get('/products', async (req, res) => {
  const { data, error } = await supabase.from('produkte').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Server läuft auf http://localhost:${PORT}`));
