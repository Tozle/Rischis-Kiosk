(function () {
  const BACKEND_URL = window.location.origin;
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  async function checkSession() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.loggedIn) {
        window.location.href = 'index.html';
      }
    } catch (err) {
      console.error('Session check failed', err);
    }
  }

  window.startSessionCheck = function () {
    checkSession();
    setInterval(checkSession, CHECK_INTERVAL);
  };
})();
