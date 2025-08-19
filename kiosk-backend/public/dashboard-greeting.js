// dashboard.js – Willkommens-Overlay nach Login, aber nur einmal pro Session
window.addEventListener('DOMContentLoaded', async () => {
    // ...existing code...

    // Zeige Willkommens-Overlay, wenn firstLogin-Flag gesetzt ist
    if (sessionStorage.getItem('firstLogin')) {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await res.json();
            let name = data?.user?.name || 'Gast';
            showLoginGreeting(name);
        } catch {
            showLoginGreeting('Gast');
        }
        sessionStorage.removeItem('firstLogin');
    }
});

function showLoginGreeting(name) {
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
    name = name.charAt(0).toUpperCase() + name.slice(1);
    const greeting = greetings[Math.floor(Math.random() * greetings.length)].replace('{name}', name);
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
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    }, 1700);
}
