// mentos.js – High-End Supabase Integration für Fütterungstracker
// Achtung: SUPABASE_URL und SUPABASE_ANON_KEY müssen im HTML eingebunden werden oder hier als Konstante stehen!



// Supabase-Keys werden wie auf den anderen Seiten über window gesetzt
if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    alert('Supabase-Konfiguration fehlt! Bitte SUPABASE_URL und SUPABASE_ANON_KEY korrekt setzen.');
    throw new Error('Supabase-Konfiguration fehlt!');
}
if (!window.supabase) {
    alert('Supabase-Bibliothek nicht geladen!');
    throw new Error('Supabase-Bibliothek nicht geladen!');
}
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
const supabase = window.supabaseClient;

const feedingsBody = document.getElementById('feedings-body');
const lastFeedDiv = document.getElementById('last-feed');
const btnNass = document.getElementById('btn-nass');
const btnTrocken = document.getElementById('btn-trocken');

async function loadFeedings() {
    const { data, error } = await supabase
        .from('mentos_feedings')
        .select('*')
        .order('zeitstempel', { ascending: false })
        .limit(20);
    if (error) {
        feedingsBody.innerHTML = '<tr><td colspan="3" class="text-red-600">Fehler beim Laden</td></tr>';
        return;
    }
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
}

function formatTimeDiff(seconds) {
    if (seconds < 60) return `${seconds} Sek.`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Min.`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} Std.`;
    return `${Math.floor(seconds / 86400)} Tage`;
}

async function addFeeding(futterart) {
    const gefuettert_von = prompt('Wer hat gefüttert? (optional)') || '';
    const { error } = await supabase
        .from('mentos_feedings')
        .insert([{ futterart, gefuettert_von }]);
    if (error) {
        alert('Fehler beim Eintragen!');
        return;
    }
    await loadFeedings();
}

btnNass?.addEventListener('click', () => addFeeding('nass'));
btnTrocken?.addEventListener('click', () => addFeeding('trocken'));

document.addEventListener('DOMContentLoaded', loadFeedings);
