
// dashboard.js – Best Practice Refactor
import { $ } from './utils/frontend.js';

// Logout-Button
const logoutBtn = $('logoutBtn');
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
const faqBtn = $('faq-btn');
const faqOverlay = $('faq-overlay');
const faqClose = $('faq-close');
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

// Adminbereich-Button nur für Admins sichtbar
const adminBtn = $('admin-btn');
if (adminBtn) {
  fetch('/api/auth/me', { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => {
      if (data?.loggedIn && data.user?.role === 'admin') {
        adminBtn.classList.remove('hidden');
        adminBtn.setAttribute('aria-hidden', 'false');
        adminBtn.setAttribute('tabindex', '0');
        adminBtn.style.display = '';
      } else {
        adminBtn.parentNode && adminBtn.parentNode.removeChild(adminBtn);
      }
    })
    .catch(() => {
      adminBtn.parentNode && adminBtn.parentNode.removeChild(adminBtn);
    });
}

// Adresse des Backends (Frontend & Backend gleiche Domain)
const BACKEND_URL = window.location.origin;

// AbortController für Fetches
const controller = new AbortController();
window.addEventListener('beforeunload', () => controller.abort());

// CSRF-Token holen
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



// Kunden der Woche laden (optional)
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
