
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

function formatTimeDiff(seconds) {
    if (seconds < 60) return `${seconds} Sek.`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Min.`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} Std.`;
    return `${Math.floor(seconds / 86400)} Tage`;
}

async function addFeeding(futterart) {
    const gefuettert_von = prompt('Wer hat gefüttert? (optional)') || '';
    try {
        const res = await fetch(`${BACKEND_URL}/api/feedings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: futterart, gefuettert_von }),
        });
        if (!res.ok) throw new Error('Fehler beim Eintragen!');
        await loadFeedings();
    } catch (err) {
        alert('Fehler beim Eintragen!');
    }
}

btnNass?.addEventListener('click', () => addFeeding('nass'));
btnTrocken?.addEventListener('click', () => addFeeding('trocken'));

document.addEventListener('DOMContentLoaded', loadFeedings);
