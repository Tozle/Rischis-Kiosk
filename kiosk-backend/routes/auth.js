import express from 'express';
import supabase from '../utils/supabase.js';
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
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return res.status(401).json({ error: 'Login fehlgeschlagen' });
    }

    setAuthCookies(res, data.session);

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

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        return res.json({ loggedIn: true, user: data.user });
      }
    }

    if (refresh) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refresh,
      });

      if (!error && data.session?.access_token) {
        setAuthCookies(res, data.session);
        return res.json({ loggedIn: true, user: data.user });
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
      name: email.split('@')[0],
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

export default router;
