
import express from 'express';
import { supabase } from '../utils/supabase.js';
import { setAuthCookies, clearAuthCookies } from '../utils/authCookies.js';
import { validateLogin, validateRegister } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import asyncHandler from '../utils/asyncHandler.js';
const router = express.Router();

// 🔐 LOGIN
router.post(
  '/login',
  loginLimiter,
  validateLogin,
  asyncHandler(async (req, res) => {
  const { name, email, password, rememberMe } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });


    if (error || !data.session) {
      console.error('Login-Fehler:', error, 'User:', email);
      return res.status(401).json({ error: error?.message || 'Login fehlgeschlagen' });
    }

  setAuthCookies(res, data.session, !!rememberMe);

    res.json({
      message: 'Login erfolgreich',
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  }),
);

// 🆕 LOGIN-STATUS PRÜFEN
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.['sb-access-token'];
    const refresh = req.cookies?.['sb-refresh-token'];

    if (!token && !refresh) {
      return res.status(401).json({ loggedIn: false });
    }


    // Helper: Holt User-Objekt inkl. Rolle und Profilbild aus DB
    async function getUserWithRole(user) {
      // user.id = Supabase-UUID
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, balance, profile_image_url')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        return { ...user, ...data };
      }
      return user;
    }

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        const userWithRole = await getUserWithRole(data.user);
        return res.json({ loggedIn: true, user: userWithRole });
      }
    }

    if (refresh) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refresh,
      });

      if (!error && data.session?.access_token) {
        setAuthCookies(res, data.session);
        const userWithRole = await getUserWithRole(data.user);
        return res.json({ loggedIn: true, user: userWithRole });
      }
    }

    res.status(401).json({ loggedIn: false });
  }),
);

// 🧾 REGISTRIEREN
router.post(
  '/register',
  validateRegister,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    const user = data?.user;
    if (error || !user) {
      return res.status(400).json({ error: 'Registrierung fehlgeschlagen' });
    }

    await supabase.from('users').insert({
      id: user.id,
      name: name || email.split('@')[0],
      email,
      role: 'buyer',
      balance: 0,
    });

    res.json({ message: 'Registrierung erfolgreich' });
  }),
);

// 🧼 LOGOUT
router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Logout erfolgreich' });
});


// 📝 PROFIL AKTUALISIEREN
router.post(
  '/profile',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.['sb-access-token'];
    if (!token) return res.status(401).json({ error: 'Nicht eingeloggt' });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Nicht eingeloggt' });
    const user = userData.user;

    const { name, password, profile_image_url } = req.body;
    let changed = {};
    // Name ändern
    if (typeof name === 'string' && name.trim() && name !== user.user_metadata?.name) {
      const { error } = await supabase.from('users').update({ name }).eq('id', user.id);
      if (error) return res.status(400).json({ error: 'Name konnte nicht geändert werden' });
      changed.name = true;
    }
    // Profilbild ändern
    if (typeof profile_image_url === 'string' && profile_image_url.trim()) {
      const { error } = await supabase.from('users').update({ profile_image_url }).eq('id', user.id);
      if (error) return res.status(400).json({ error: 'Profilbild konnte nicht geändert werden' });
      changed.profile_image_url = true;
    }
    // Passwort ändern
    if (typeof password === 'string' && password.length >= 6) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return res.status(400).json({ error: 'Passwort konnte nicht geändert werden' });
      changed.password = true;
    }
    if (Object.keys(changed).length === 0) {
      return res.status(400).json({ error: 'Keine Änderungen übergeben' });
    }
    res.json({ message: 'Profil aktualisiert', changed });
  })
);

export default router;
