// dashboard.js – Admin-Zugriff und Session-Check

// Adresse des Backends
// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;

const controller = new AbortController();
window.addEventListener('beforeunload', () => controller.abort());

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
      signal: controller.signal,
    });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

let overlayShown = false;
let overlayText;

async function checkUserAndRole(retries = 6) {
  try {
    // Erst prüfen, ob eine gültige Session existiert
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      signal: controller.signal,
    });
    const { loggedIn } = await meRes.json();

    if (!meRes.ok || !loggedIn) {
      if (retries > 0) {
        setTimeout(() => checkUserAndRole(retries - 1), 500);
        return;
      }
      window.location.href = 'index.html';
      return;
    }

    if (!overlayShown) {
      overlayShown = true;
      if (sessionStorage.getItem('firstLogin') === 'true') {
        sessionStorage.setItem('firstLogin', 'false');
        showWelcome();
      } else {
        showLoading();
      }
    }

    // Danach Benutzerdaten laden
    const res = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: 'include',
      signal: controller.signal,
    });
    const user = await res.json();

    if (!user?.id) {
      window.location.href = 'index.html';
      return;
    }

    if (user.role === 'admin') {
      document.getElementById('admin-btn')?.classList.remove('hidden');
    }

    updateWelcomeName(user.name);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('Fehler beim Laden des Nutzers', err);
    window.location.href = 'index.html';
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

async function loadCustomerOfWeek() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/customer-of-week`, {
      credentials: 'include',
      signal: controller.signal,
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.name) {
      const el = document.getElementById('customer-week');
      if (el) el.textContent = `\u2728 Kunde der Woche: ${data.name}`;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Fehler beim Laden Kunde der Woche', err);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  checkUserAndRole();
  loadCustomerOfWeek();
  if (typeof startSessionCheck === 'function') startSessionCheck();
});

async function logout() {
  try {
    const token = await getCsrfToken();
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': token },
      signal: controller.signal,
    });
  } catch (err) {
    console.error('Fehler beim Logout', err);
  } finally {
    sessionStorage.removeItem('firstLogin');
    window.location.href = 'index.html';
  }
}

function showWelcome() {
  const overlay = document.createElement('div');
  overlay.id = 'welcome-overlay';
  overlay.className =
    'fixed inset-0 flex flex-col items-center justify-center z-50 text-2xl font-bold bg-white/90 dark:bg-gray-800/90';
  overlay.style.opacity = '1';

  overlayText = document.createElement('div');
  overlayText.id = 'welcome-text';
  overlayText.textContent = '🎉 Willkommen bei Rischi!';
  overlay.appendChild(overlayText);

  const barContainer = document.createElement('div');
  barContainer.className =
    'welcome-bar-container w-2/3 h-2 bg-gray-300 dark:bg-gray-700 rounded mt-4 overflow-hidden';

  const bar = document.createElement('div');
  bar.className = 'welcome-bar h-full bg-green-600 dark:bg-green-500';
  bar.style.width = '0%';
  bar.style.transition = 'width 2s linear';
  barContainer.appendChild(bar);

  overlay.appendChild(barContainer);

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    bar.style.width = '100%';
  });
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.addEventListener('transitionend', () => overlay.remove(), {
      once: true,
    });
  }, 2000);
}

function showLoading() {
  const overlay = document.createElement('div');
  overlay.id = 'welcome-overlay';
  overlay.className =
    'fixed inset-0 flex flex-col items-center justify-center z-50 text-2xl font-bold bg-white/90 dark:bg-gray-800/90';
  overlay.style.opacity = '1';

  const text = document.createElement('div');
  text.textContent = '🔄 Einen Moment...';
  overlay.appendChild(text);

  const barContainer = document.createElement('div');
  barContainer.className =
    'welcome-bar-container w-2/3 h-2 bg-gray-300 dark:bg-gray-700 rounded mt-4 overflow-hidden';

  const bar = document.createElement('div');
  bar.className = 'welcome-bar h-full bg-green-600 dark:bg-green-500';
  bar.style.width = '0%';
  bar.style.transition = 'width 1s linear';
  barContainer.appendChild(bar);

  overlay.appendChild(barContainer);

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    bar.style.width = '100%';
  });
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.addEventListener('transitionend', () => overlay.remove(), {
      once: true,
    });
  }, 1000);
}

function updateWelcomeName(name) {
  if (overlayText && name) {
    overlayText.textContent = `🎉 Willkommen, ${name}!`;
  }
}
