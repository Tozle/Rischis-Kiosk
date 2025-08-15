// routes/purchases.js
import express from 'express';
import supabase from '../utils/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
const router = express.Router();

// GET /api/purchases?sort=desc|asc|price_asc|price_desc&limit=3
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;

  const sortOptions = {
    asc: { column: 'created_at', asc: true },
    desc: { column: 'created_at', asc: false },
    price_asc: { column: 'price', asc: true },
    price_desc: { column: 'price', asc: false },
  };
  const { column, asc } = sortOptions[req.query.sort] || sortOptions.desc;
  const limit = parseInt(req.query.limit);
  let query = supabase
    .from('purchases')
    .select('price, quantity, created_at, product_name, product_id')
    .eq('user_id', user.id)
    .order(column, { ascending: asc });

  if (Number.isInteger(limit) && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
  }),
);

export default router;
