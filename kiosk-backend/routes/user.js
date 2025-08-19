import express from 'express';
import { supabase } from '../utils/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
const router = express.Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error || !data)
      return res.status(404).json({ error: 'Nutzer nicht gefunden' });

    const { data: session } = await supabase
      .from('user_sessions')
      .select('online')
      .eq('user_id', user.id)
      .single();

    res.json({ ...data, online: session?.online || false });
  }),
);

export default router;
