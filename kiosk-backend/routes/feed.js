import express from 'express';
import { supabase } from '../utils/supabase.js';
import { getUser as getUserFromRequest } from '../utils/getUser.js';
import getUserName from '../utils/getUserName.js';
import { requireAdmin } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
const router = express.Router();

// Liste der letzten Fütterungen
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('mentos_feedings')
      .select('zeitstempel,futterart,gefuettert_von')
      .order('zeitstempel', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }),
);

// Neue Fütterung eintragen (optional mit Benutzer)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const user = await getUserFromRequest(req, res);
      const { type } = req.body;
      const name = user ? (await getUserName(user.id)) || user.email : null;
      const insertObj = {
        futterart: type,
        gefuettert_von: name,
        zeitstempel: new Date().toISOString(),
      };
      const { error } = await supabase.from('mentos_feedings').insert(insertObj);
      if (error) {
        console.error('Supabase Insert Error:', error);
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (err) {
      console.error('API /api/feedings error:', err);
      res.status(500).json({ error: err.message || 'Unknown error' });
    }
  }),
);

// Verlauf löschen (nur Admin)
router.delete(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { error } = await supabase
      .from('mentos_feedings')
      .delete()
      .gt('zeitstempel', '1900-01-01');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  }),
);

export default router;
