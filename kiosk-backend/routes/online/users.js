const express = require('express');
const router = express.Router();
const { supabase } = require('../../utils/supabase');
const { getUser } = require('../../utils/getUser');

// POST /api/online-users
router.post('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { session_id, page, username, profile_image_url } = req.body;
  if (!session_id || !page) return res.status(400).json({ error: 'session_id und page erforderlich' });

  // Upsert (ersetze falls vorhanden)
  const { error } = await supabase
    .from('online_users')
    .upsert({
      user_id: user.id,
      session_id,
      page,
      username: username || user.name,
      profile_image_url: profile_image_url || user.profile_image_url,
      last_active: new Date().toISOString(),
    }, { onConflict: ['user_id', 'session_id'] });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/online-users
router.delete('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id erforderlich' });

  const { error } = await supabase
    .from('online_users')
    .delete()
    .match({ user_id: user.id, session_id });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/online-users?page=games
router.get('/', async (req, res) => {
  const { page } = req.query;
  if (!page) return res.status(400).json({ error: 'page erforderlich' });
  const since = new Date(Date.now() - 30000).toISOString(); // 30 Sekunden aktiv
  const { data, error } = await supabase
    .from('online_users')
    .select('user_id,username,profile_image_url,session_id,last_active')
    .eq('page', page)
    .gte('last_active', since);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

module.exports = router;
