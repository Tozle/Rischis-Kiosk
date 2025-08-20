import env from './env.js';


export function getCookieOptions(rememberMe = false) {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    // 1 Tag Standard, 30 Tage bei rememberMe
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  };
  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }
  return options;
}

export function setAuthCookies(res, { access_token, refresh_token }, rememberMe = false) {
  if (access_token) {
    res.cookie('sb-access-token', access_token, getCookieOptions(rememberMe));
  }
  if (refresh_token) {
    res.cookie('sb-refresh-token', refresh_token, getCookieOptions(rememberMe));
  }
}

export function clearAuthCookies(res) {
  res.clearCookie('sb-access-token', getCookieOptions());
  res.clearCookie('sb-refresh-token', getCookieOptions());
}
