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
// CSP: Event-Binding für Formular-Umschaltung
const showRegister = document.getElementById('show-register-link');
if (showRegister) {
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm('register');
  });
}
const showLogin = document.getElementById('show-login-link');
if (showLogin) {
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm('login');
  });
}

// REGISTRIERUNG

document
  .getElementById('register-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const repeat = document.getElementById('register-password-repeat').value;

    const btn = document.querySelector('#register-form button[type="submit"]');
    const btnText = document.getElementById('register-btn-text');
    const loader = document.getElementById('register-loader');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    btnText.classList.add('opacity-50');
    loader.classList.remove('hidden');

    if (password !== repeat) {
      showMessage('Passwörter stimmen nicht überein.');
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
      btnText.classList.remove('opacity-50');
      loader.classList.add('hidden');
      return;
    }

    try {
      const token = await getCsrfToken();
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || 'Registrierung fehlgeschlagen');

      showMessage('Registrierung erfolgreich! Bitte jetzt einloggen.', true);
      switchForm('login');
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Fehler bei Registrierung');
    } finally {
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
      btnText.classList.remove('opacity-50');
      loader.classList.add('hidden');
    }
  });

// LOGIN
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;
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
      body: JSON.stringify({ email, password, rememberMe }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login fehlgeschlagen');
    // Personalisierte Begrüßung anzeigen (mit echtem Namen)
    sessionStorage.setItem('firstLogin', 'true');
    let name = null;
    for (let i = 0; i < 10; i++) {
      try {
        const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        const meData = await meRes.json();
        if (meRes.ok && meData.loggedIn && meData.user && meData.user.name) {
          name = meData.user.name;
          break;
        }
      } catch { }
      await new Promise((r) => setTimeout(r, 500));
    }
    showLoginGreeting(name || email.split('@')[0]);
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

// Lustige Begrüßung mit Animation nach Login
function showLoginGreeting(email) {
  const greetings = [
    'Willkommen zurück, {name}! 😺',
    'Schön, dass du wieder da bist, {name}! 🎉',
    'Bereit für Snacks, {name}? 🍫',
    'Möge der Kiosk mit dir sein, {name}! 🚀',
    'Let’s Kiosk, {name}! 😎',
    'Zeit für eine Pause, {name}! ☕',
    'Du bist der Kiosk-King, {name}! 👑',
    'Snack-Alarm für {name}! 🛎️',
    'Miau, {name}! 🐾',
    'Kiosk-Power aktiviert, {name}! ⚡',
  ];
  // Name kann direkt übergeben werden
  let name = email;
  if (typeof name === 'string') {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  } else {
    name = 'Gast';
  }
  const greeting = greetings[Math.floor(Math.random() * greetings.length)].replace('{name}', name);
  // Overlay erzeugen
  let overlay = document.createElement('div');
  overlay.id = 'login-greeting-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(16,185,129,0.95)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  overlay.style.transition = 'opacity 0.5s';
  overlay.style.opacity = '0';
  overlay.innerHTML = `
    <div style="background:rgba(255,255,255,0.95);color:#134e4a;padding:2.5rem 2rem 2rem 2rem;border-radius:2rem;box-shadow:0 8px 32px 0 rgba(16,185,129,0.18);font-size:2rem;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:90vw;text-align:center;animation:bounceIn 0.7s;">
      <span style="font-size:2.5rem;">🎈</span>
      <span>${greeting}</span>
    </div>
    <style>
      @keyframes bounceIn {
        0% { transform: scale(0.7); opacity: 0; }
        60% { transform: scale(1.1); opacity: 1; }
        80% { transform: scale(0.95); }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; }, 10);
  // Nach 1.7s ausblenden und weiterleiten
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      window.location.href = 'dashboard.html';
    }, 500);
  }, 1700);
}

