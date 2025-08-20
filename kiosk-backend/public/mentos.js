// Darkmode-Logik entfernt
// mentos.js – jetzt wie shop.js: alle Datenzugriffe über das Backend

import { $, getCsrfToken, formatTimeDiff, showToast } from './utils/frontend.js';
const BACKEND_URL = window.location.origin;

const feedingsBody = $('feedings-body');
const lastFeedDiv = $('last-feed');


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





// Use centralized showToast from utils/frontend.js

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



document.addEventListener('DOMContentLoaded', () => {
    loadFeedings();

    // Feeding-Buttons initialisieren
    const btnNass = document.getElementById('btn-nass');
    const btnTrocken = document.getElementById('btn-trocken');
    if (btnNass) btnNass.addEventListener('click', () => addFeeding('Nassfutter'));
    if (btnTrocken) btnTrocken.addEventListener('click', () => addFeeding('Trockenfutter'));

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
