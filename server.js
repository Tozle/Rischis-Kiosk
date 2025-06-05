const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const rootDir = path.join(__dirname);

// Serve static files
app.use(express.static(rootDir));

// Endpoint to provide config from env vars
app.get('/config.js', (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_KEY || '';
  res.type('application/javascript');
  res.send(`window.SUPABASE_URL = '${url}';\nwindow.SUPABASE_KEY = '${key}';`);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
