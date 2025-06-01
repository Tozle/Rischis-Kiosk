const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const db = new sqlite3.Database("/app/kiosk.db");
const PORT = 3000;

app.use(express.json());

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS verkauf (id INTEGER PRIMARY KEY, name TEXT, produkt TEXT, menge INTEGER, zeit TEXT)");
});

app.post("/verkauf", (req, res) => {
  const { name, produkt, menge } = req.body;
  const zeit = new Date().toISOString();
  db.run("INSERT INTO verkauf (name, produkt, menge, zeit) VALUES (?, ?, ?, ?)", [name, produkt, menge, zeit], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.listen(PORT, () => {
  console.log("Kiosk Server läuft auf Port", PORT);
});
