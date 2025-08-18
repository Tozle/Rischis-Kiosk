// CSP-konformes Event-Binding für Darkmode-Button
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
    document.documentElement.classList.add('dark');
}
document.addEventListener('DOMContentLoaded', () => {
    const darkBtn = document.getElementById('darkmode-toggle-btn');
    if (darkBtn) {
        darkBtn.addEventListener('click', toggleDarkMode);
    }
});
// mentos.js – jetzt wie shop.js: alle Datenzugriffe über das Backend
const BACKEND_URL = window.location.origin;

const feedingsBody = document.getElementById('feedings-body');
const lastFeedDiv = document.getElementById('last-feed');
const btnNass = document.getElementById('btn-nass');
const btnTrocken = document.getElementById('btn-trocken');

async function loadFeedings() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/feedings`);
        const data = await res.json();
        feedingsBody.innerHTML = '';
        data.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-2 py-1">${new Date(f.zeitstempel).toLocaleString('de-DE')}</td>
                <td class="px-2 py-1">${f.futterart === 'nass' ? 'Nassfutter' : f.futterart === 'trocken' ? 'Trockenfutter' : f.futterart}</td>
                <td class="px-2 py-1">${f.gefuettert_von || '-'}</td>
            `;
            feedingsBody.appendChild(tr);
        });
        if (data.length > 0) {
            const last = data[0];
            const diff = Math.floor((Date.now() - new Date(last.zeitstempel)) / 1000);
            lastFeedDiv.textContent = formatTimeDiff(diff);
        } else {
            lastFeedDiv.textContent = '-';
        }
    } catch (err) {
        feedingsBody.innerHTML = '<tr><td colspan="3" class="text-red-600">Fehler beim Laden</td></tr>';
    }
}

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

function formatTimeDiff(seconds) {
    // Immer in Stunden anzeigen, auch wenn >24h
    return `${Math.floor(seconds / 3600)} Std.`;
}

function showToast(msg, type = 'success') {
    let toast = document.getElementById('mentos-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'mentos-toast';
        toast.style.position = 'fixed';
        toast.style.top = '2rem';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.zIndex = '9999';
        toast.style.padding = '1rem 2rem';
        toast.style.borderRadius = '1rem';
        toast.style.fontWeight = 'bold';
        toast.style.fontSize = '1.1rem';
        toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.style.color = 'white';
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

async function addFeeding(futterart) {
    const btn = futterart === 'Nassfutter' ? btnNass : btnTrocken;
    btn.disabled = true;
    btn.classList.add('opacity-60');
    btn.textContent = '...';
    try {
        const csrfToken = await getCsrfToken();
        const res = await fetch(`${BACKEND_URL}/api/feedings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            credentials: 'include',
            body: JSON.stringify({ type: futterart }),
        });
        if (!res.ok) {
            let msg = 'Fehler beim Eintragen!';
            try {
                const err = await res.json();
                if (err && err.error) msg += `\n${err.error}`;
            } catch { }
            throw new Error(msg);
        }
        await loadFeedings();
        showToast('Fütterung gespeichert!', 'success');
    } catch (err) {
        showToast(err.message || 'Fehler beim Eintragen!', 'error');
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-60');
        btn.textContent = futterart === 'Nassfutter' ? '🐟 Nassfutter gegeben' : '🥣 Trockenfutter gegeben';
    }
}

btnNass?.addEventListener('click', () => addFeeding('Nassfutter'));
btnTrocken?.addEventListener('click', () => addFeeding('Trockenfutter'));

document.addEventListener('DOMContentLoaded', () => {

    loadFeedings();

    // Admin-Buttons sichtbar machen, wenn User Admin ist
    import('./user.js').then(({ getCurrentUser }) => {
        getCurrentUser().then(user => {
            if (user && (user.role === 'admin' || user.role === 'superadmin')) {
                const adminDiv = document.getElementById('admin-buttons');
                if (adminDiv) adminDiv.classList.remove('hidden');
                
                    // Löschen-Button: Verlauf löschen
                    const clearBtn = document.getElementById('clear-history-btn');
                    if (clearBtn) {
                        clearBtn.addEventListener('click', async () => {
                            if (!confirm('Möchtest du wirklich den gesamten Fütterungsverlauf unwiderruflich löschen?')) return;
                            clearBtn.disabled = true;
                            clearBtn.textContent = '...';
                            try {
                                const csrfToken = await getCsrfToken();
                                const res = await fetch(`${BACKEND_URL}/api/feedings`, {
                                    method: 'DELETE',
                                    headers: {
                                        'CSRF-Token': csrfToken,
                                    },
                                    credentials: 'include',
                                });
                                if (!res.ok) throw new Error('Fehler beim Löschen!');
                                showToast('Verlauf gelöscht!', 'success');
                                await loadFeedings();
                            } catch (err) {
                                showToast(err.message || 'Fehler beim Löschen!', 'error');
                            } finally {
                                clearBtn.disabled = false;
                                clearBtn.textContent = '🗑️ Anzeige löschen';
                            }
                        });
                    }
            }
        });
    });

    // FAQ Overlay-Logik
    const faqBtn = document.getElementById('faq-btn');
    const faqOverlay = document.getElementById('faq-overlay');
    const faqClose = document.getElementById('faq-close');
    if (faqBtn && faqOverlay && faqClose) {
        faqBtn.addEventListener('click', () => { faqOverlay.classList.remove('hidden'); faqClose.focus(); });
        faqClose.addEventListener('click', () => { faqOverlay.classList.add('hidden'); faqBtn.focus(); });
        faqOverlay.addEventListener('click', (e) => { if (e.target === faqOverlay) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
        document.addEventListener('keydown', (e) => { if (!faqOverlay.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
    }

    // Darkmode-Initialisierung (nur falls noch nicht gesetzt)
    if (localStorage.getItem('darkMode') === null) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
    } else if (localStorage.getItem('darkMode') !== 'false') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Logout-Button
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

    // Session timeout (20 min inactivity)
    let sessionTimeout;
    function resetSessionTimeout() {
        clearTimeout(sessionTimeout);
        sessionTimeout = setTimeout(() => {
            alert('Session abgelaufen. Du wirst abgemeldet.');
            fetch('/api/logout', { method: 'POST', credentials: 'include' })
                .finally(() => {
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                });
        }, 20 * 60 * 1000);
    }
    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, resetSessionTimeout);
    });
    resetSessionTimeout();
});
