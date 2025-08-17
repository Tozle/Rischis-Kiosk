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

async function addFeeding(futterart) {
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
            } catch {}
            throw new Error(msg);
        }
        await loadFeedings();
    } catch (err) {
        alert(err.message || 'Fehler beim Eintragen!');
    }
}

btnNass?.addEventListener('click', () => addFeeding('nass'));
btnTrocken?.addEventListener('click', () => addFeeding('trocken'));

document.addEventListener('DOMContentLoaded', loadFeedings);
