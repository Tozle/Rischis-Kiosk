import express from 'express';
import { supabase } from '../../utils/supabase.js';
import { requireAdmin } from '../../middleware/auth.js';
import asyncHandler from '../../utils/asyncHandler.js';
const router = express.Router();

router.use(requireAdmin);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('purchases')
      .select('user_name, product_name, price, quantity, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }),
);

router.delete(
  '/:product_id',
  asyncHandler(async (req, res) => {
    const { product_id } = req.params;
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('product_id', product_id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  }),
);

export default router;
