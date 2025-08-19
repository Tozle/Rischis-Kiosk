import express from 'express';
import { supabase } from '../../utils/supabase.js';
import { requireAdmin } from '../../middleware/auth.js';
import asyncHandler from '../../utils/asyncHandler.js';
const router = express.Router();

router.use(requireAdmin);

// Liste aller Nutzer
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, balance');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }),
);

// Einzelnen Nutzer laden
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, balance')
      .eq('id', id)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  }),
);

// Name oder Balance aktualisieren
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, balance } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (balance !== undefined) updates.balance = balance;
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'updated' });
  }),
);

// Passwort ändern
router.put(
  '/:id/password',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'password updated' });
  }),
);


// Benutzer löschen
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Erst aus Supabase Auth löschen
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) return res.status(500).json({ error: authError.message });
    // Dann aus der users-Tabelle löschen
    const { error: dbError } = await supabase.from('users').delete().eq('id', id);
    if (dbError) return res.status(500).json({ error: dbError.message });
    res.json({ message: 'deleted' });
  })
);

export default router;
