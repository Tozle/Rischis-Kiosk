// CSP-konforme Event-Handler für Logout und Darkmode
window.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch('/api/logout', { method: 'POST', credentials: 'include' })
        .finally(() => {
          sessionStorage.clear();
          window.location.href = '/index.html';
        });
    });
  }
  // FAQ Overlay-Logik nur im Dashboard
  const faqBtn = document.getElementById('faq-btn');
  const faqOverlay = document.getElementById('faq-overlay');
  const faqClose = document.getElementById('faq-close');
  if (faqBtn && faqOverlay && faqClose) {
    faqBtn.addEventListener('click', () => {
      faqOverlay.classList.remove('hidden');
      faqClose.focus();
    });
    faqClose.addEventListener('click', () => {
      faqOverlay.classList.add('hidden');
      faqBtn.focus();
    });
    faqOverlay.addEventListener('click', (e) => {
      if (e.target === faqOverlay) {
        faqOverlay.classList.add('hidden');
        faqBtn.focus();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (!faqOverlay.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) {
        faqOverlay.classList.add('hidden');
        faqBtn.focus();
      }
    });
  }
});
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
}

// ...Ende dashboard.js: Datei jetzt korrekt abgeschlossen
