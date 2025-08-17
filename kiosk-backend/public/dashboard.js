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
    if (!res.ok) return null;
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
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
    // ...nutze data falls benötigt...
  } catch (err) {
    console.error('Fehler beim Laden des Kunden der Woche', err);
  }
