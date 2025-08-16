import express from 'express';
import supabase from '../../utils/supabase.js';
import { requireAdmin } from '../../middleware/auth.js';
import asyncHandler from '../../utils/asyncHandler.js';
const router = express.Router();

router.use(requireAdmin);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock, available, category');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, price, purchase_price, stock, category, created_by, image_url } = req.body;

    if (
      !name ||
      price === undefined ||
      purchase_price === undefined ||
      stock === undefined ||
      !category ||
      !created_by
    ) {
      return res.status(400).json({ error: 'Fehlende Felder' });
    }

    const { error } = await supabase.from('products').insert({
      name,
      price,
      purchase_price,
      stock,
      category,
      available: true,
      created_by,
      image_url,
    });

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Produkt gespeichert' });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, price, stock } = req.body;
    const { error } = await supabase
      .from('products')
      .update({ name, price, stock })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produkt aktualisiert' });
  }),
);

// Verfügbarkeit eines Produkts umschalten
router.put(
  '/:id/available',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { available } = req.body;
    const { error } = await supabase
      .from('products')
      .update({ available })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produkt aktualisiert' });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  }),
);

export default router;
