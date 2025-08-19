import express from 'express';
import { supabase } from '../utils/supabase.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('purchases')
      .select('user_id, user_name, price')
      .gte('created_at', since);

    if (error) return res.status(500).json({ error: error.message });

    const totals = new Map();
    data.forEach((p) => {
      const existing = totals.get(p.user_id) || { name: p.user_name, total: 0 };
      existing.total += p.price || 0;
      totals.set(p.user_id, existing);
    });

    let best = null;
    for (const [id, info] of totals.entries()) {
      if (!best || info.total > best.total) {
        best = { id, name: info.name, total: info.total };
      }
    }

    res.json(best);
  }),
);

export default router;
