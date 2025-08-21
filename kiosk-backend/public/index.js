// Basis-URL des Backends
// Hier wird der Endpunkt genutzt, der auf Render als Backend
// deployt ist. Alle API-Aufrufe des Frontends verwenden diese
// Konstante, damit Frontend und Backend korrekt kommunizieren.
// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;



import { $, getCsrfToken, showMessage } from './utils/frontend.js';

function switchForm(mode) {
  const isLogin = mode === 'login';
  const loginForm = $('login-form');
  if (loginForm) loginForm.classList.toggle('hidden', !isLogin);
  const registerForm = $('register-form');
  if (registerForm) registerForm.classList.toggle('hidden', isLogin);
  const message = $('message');
  if (message) message.classList.add('hidden');
}

// Event-Binding für Formular-Umschaltung
const showRegister = $('show-register-link');
if (showRegister) {
  showRegister.addEventListener('click', (e) => { e.preventDefault(); switchForm('register'); });
}
const showLogin = $('show-login-link');
if (showLogin) {
  showLogin.addEventListener('click', (e) => { e.preventDefault(); switchForm('login'); });
}

// REGISTRIERUNG
const registerForm = $('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl = $('register-name');
    const emailEl = $('register-email');
    const passwordEl = $('register-password');
    const repeatEl = $('register-password-repeat');
    const btn = registerForm.querySelector('button[type="submit"]');
    const btnText = $('register-btn-text');
    const loader = $('register-loader');
    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const repeat = repeatEl ? repeatEl.value : '';
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
    }
    if (btnText) btnText.classList.add('opacity-50');
    if (loader) loader.classList.remove('hidden');
    // Frontend-Validierung auf Deutsch
    if (!name || !email) {
      if (btnText) btnText.classList.remove('opacity-50');
      if (loader) loader.classList.add('hidden');
      return;
    }
    if (!password || password.length < 6) {
      showMessage('Das Passwort muss mindestens 6 Zeichen lang sein.');
      if (btn) {
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      }
      if (btnText) btnText.classList.remove('opacity-50');
      if (loader) loader.classList.add('hidden');
      return;
    }
    if (password !== repeat) {
      showMessage('Passwörter stimmen nicht überein.');
      if (btn) {
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      }
      if (btnText) btnText.classList.remove('opacity-50');
      if (loader) loader.classList.add('hidden');
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

      // Modernes Overlay anzeigen
      let overlay = document.createElement('div');
      overlay.id = 'register-success-overlay';
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
          <span style="font-size:2.5rem;">🎉</span>
          <span>Registrierung erfolgreich!<br><span style='font-size:1.1rem;font-weight:400;'>Du kannst dich jetzt einloggen.</span></span>
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
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          switchForm('login');
        }, 500);
      }, 1700);
    } catch (err) {
      console.error(err);
      // Backend-Fehler auf Deutsch anzeigen, falls möglich
      let msg = err.message || 'Fehler bei Registrierung';
      if (/name/i.test(msg) && /zeichen|zeichenlang|zeichen lang|zu kurz|mindestens/i.test(msg)) {
        msg = 'Bitte gib einen Namen mit mindestens 2 Zeichen an.';
      } else if (/email/i.test(msg) && /ungültig|invalid/i.test(msg)) {
        msg = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      } else if (/passwort|password/i.test(msg) && /ungültig|invalid|mindestens|zu kurz|zeichen/i.test(msg)) {
        msg = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      }
      showMessage(msg);
    } finally {
      if (btn) {
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      }
      if (btnText) btnText.classList.remove('opacity-50');
      if (loader) loader.classList.add('hidden');
    }
  });

  // LOGIN
  const loginFormEl = document.getElementById('login-form');
  if (loginFormEl) loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('login-email');
    const passwordEl = document.getElementById('login-password');
    const rememberMeEl = document.getElementById('remember-me');
    const btn = document.querySelector('#login-form button[type="submit"]');
    const btnText = document.getElementById('login-btn-text');
    const loader = document.getElementById('login-loader');
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const rememberMe = rememberMeEl ? rememberMeEl.checked : false;
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
    }
    if (btnText) btnText.classList.add('opacity-50');
    if (loader) loader.classList.remove('hidden');
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

  const loginForm = document.getElementById('login-form');
  const lobbyCreationSection = document.querySelector('.lobby-creation');
  if (loginForm && lobbyCreationSection) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      // Simulate successful login (replace with actual login logic)
      const isLoggedIn = true;
      if (isLoggedIn) {
        lobbyCreationSection.classList.remove('hidden');
      }
    });
  }
}

