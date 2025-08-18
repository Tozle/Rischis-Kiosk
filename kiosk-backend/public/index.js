// Basis-URL des Backends
// Hier wird der Endpunkt genutzt, der auf Render als Backend
// deployt ist. Alle API-Aufrufe des Frontends verwenden diese
// Konstante, damit Frontend und Backend korrekt kommunizieren.
// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

// Meldung anzeigen
function showMessage(text, success = false) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = success
    ? 'text-green-600 mt-4 text-center'
    : 'text-red-500 mt-4 text-center';
  message.classList.remove('hidden');
  setTimeout(() => message.classList.add('hidden'), 5000);
}

// Formular-Umschaltung
function switchForm(mode) {
  const isLogin = mode === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !isLogin);
  document.getElementById('register-form').classList.toggle('hidden', isLogin);
  document.getElementById('message').classList.add('hidden');
}

// Darkmode
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

// LOGIN
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.querySelector('#login-form button[type="submit"]');
  const btnText = document.getElementById('login-btn-text');
  const loader = document.getElementById('login-loader');
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  btnText.classList.add('opacity-50');
  loader.classList.remove('hidden');
  try {
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login fehlgeschlagen');
    showMessage('Login erfolgreich! Weiterleitung...', true);
    sessionStorage.setItem('firstLogin', 'true');
    const waitForSession = async (retries = 10) => {
      for (let i = 0; i < retries; i++) {
        try {
          const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
            credentials: 'include',
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.loggedIn) {
            window.location.href = 'dashboard.html';
            return;
          }
        } catch { }
        await new Promise((r) => setTimeout(r, 500));
      }
      window.location.href = 'dashboard.html';
    };
    await waitForSession();
  } catch (err) {
    console.error(err);
    showMessage(err.message || 'Fehler beim Login');
  } finally {
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    btnText.classList.remove('opacity-50');
    loader.classList.add('hidden');
  }
});

// REGISTRIERUNG
document
  .getElementById('register-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const repeat = document.getElementById('register-password-repeat').value;

    if (password !== repeat)
      return showMessage('Passwörter stimmen nicht überein.');

    try {
      const token = await getCsrfToken();
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || 'Registrierung fehlgeschlagen');

      showMessage('Registrierung erfolgreich! Bitte jetzt einloggen.', true);
      switchForm('login');
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Fehler bei Registrierung');
    }
  });
