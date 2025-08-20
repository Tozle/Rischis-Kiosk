// Zentrale Frontend-Utils für alle Kiosk-Skripte

export const $ = (id) => document.getElementById(id);

export async function getCsrfToken() {
  try {
    const res = await fetch(`${window.location.origin}/api/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

export function showToast(msg, type = 'success', duration = 3000, undoCallback = null) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = msg;
  toast.appendChild(span);
  if (undoCallback) {
    const btn = document.createElement('button');
    btn.textContent = 'Rückgängig';
    btn.className = 'ml-4 px-3 py-1 rounded bg-white/80 text-green-700 font-bold shadow hover:bg-green-100 transition text-xs';
    btn.onclick = () => {
      undoCallback();
      toast.classList.add('opacity-0');
    };
    toast.appendChild(btn);
  }
  toast.className = `fixed left-1/2 top-6 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-sm font-semibold transition-opacity duration-300 pointer-events-none ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white opacity-100`;
  if (!undoCallback) {
    setTimeout(() => {
      toast.classList.add('opacity-0');
    }, duration);
  }
}

export function showLoader(show = true) {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.toggle('hidden', !show);
}

export function showMessage(text, success = false) {
  const message = document.getElementById('message');
  if (!message) return;
  message.textContent = text;
  message.className = success ? 'text-green-600 mt-4 text-center' : 'text-red-500 mt-4 text-center';
  message.classList.remove('hidden');
  setTimeout(() => message.classList.add('hidden'), 5000);
}
