// kiosk-backend/utils/getUser.js
import supabase from './supabase.js';
import { setAuthCookies } from './authCookies.js';

export async function getUser(req, res) {
  const access =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.['sb-access-token'];
  const refresh = req.cookies?.['sb-refresh-token'];

  if (!access && !refresh) return null;

  if (access) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access);
    if (!error && user) return user;
  }

  if (refresh) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh,
    });

    if (!error && data.session?.access_token) {
      if (res) {
        setAuthCookies(res, data.session);
      }
      return data.user;
    }
  }

  return null;
}
