import env from './env.js';

export function getCookieOptions() {
  const options = {
    httpOnly: true, // Immer httpOnly
    secure: true,   // Immer secure
    sameSite: 'strict', // Immer SameSite=strict
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function setAuthCookies(res, { access_token, refresh_token }) {
  if (access_token) {
    res.cookie('sb-access-token', access_token, getCookieOptions());
  }
  if (refresh_token) {
    res.cookie('sb-refresh-token', refresh_token, getCookieOptions());
  }
}

export function clearAuthCookies(res) {
  res.clearCookie('sb-access-token', getCookieOptions());
  res.clearCookie('sb-refresh-token', getCookieOptions());
}
