// buzzer.js – einfache Steuerung der Buzzer-Seite

const BACKEND_URL = window.location.origin;

const buzzerSound = new Audio('buzz.wav');

let currentUser = null;

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken;
  } catch {
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

async function checkUser(retries = 6) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: 'include',
    });
    if (!res.ok) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return checkUser(retries - 1);
      }
      throw new Error('not auth');
    }
    const user = await res.json();
    return user;
  } catch (err) {
    if (retries > 0 && err.name !== 'AbortError') {
      await new Promise((r) => setTimeout(r, 500));
      return checkUser(retries - 1);
    }
    window.location.href = 'index.html';
    return null;
  }
}

async function loadRound() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round`, {
    credentials: 'include',
  });
  let round = null;
  if (res.status !== 404) {
    if (!res.ok) return;
    const data = await res.json();
    round = data.round;
  }

  const infoEl = document.getElementById('round-info');
  const joinBtn = document.getElementById('join-btn');
  const endBtn = document.getElementById('end-round-btn');
  const lockBtn = document.getElementById('lock-round-btn');
  const koloControls = document.getElementById('kolo-controls');
  const roundForm = document.getElementById('round-form');

  if (round) {
    infoEl.textContent = `Einsatz: ${round.bet} €, Limit: ${round.points_limit}`;
    if (round.joinable === false) {
      joinBtn.classList.add('hidden');
      lockBtn?.classList.add('hidden');
    } else {
      joinBtn.classList.remove('hidden');
      if (currentUser?.role === 'admin') lockBtn?.classList.remove('hidden');
    }
    if (currentUser?.role === 'admin') {
      endBtn?.classList.remove('hidden');
      koloControls?.classList.remove('hidden');
      roundForm?.classList.add('hidden');
    }
  } else {
    infoEl.textContent = 'Keine laufende Runde';
    joinBtn.classList.add('hidden');
    endBtn?.classList.add('hidden');
    lockBtn?.classList.add('hidden');
    koloControls?.classList.add('hidden');
    if (currentUser?.role === 'admin') {
      roundForm?.classList.remove('hidden');
    }
  }
}

async function loadKolo() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/kolo`, {
    credentials: 'include',
  });
  let kolo = null;
  let number = 0;
  if (res.status !== 404) {
    if (!res.ok) return;
    const data = await res.json();
    kolo = data.kolo;
    number = data.number;
  }
  const infoEl = document.getElementById('kolo-info');
  if (kolo && kolo.active) {
    infoEl.textContent = `Aktives KOLO #${number}`;
  } else {
    infoEl.textContent = 'Warte auf neues KOLO…';
  }
}

async function loadParticipants() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/participants`, {
    credentials: 'include',
  });
  if (!res.ok) {
    document.getElementById('participant-list').innerHTML = '';
    return;
  }
  const { participants } = await res.json();
  const listEl = document.getElementById('participant-list');
  listEl.innerHTML = '';
  participants.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = p.users?.name || p.username || p.user_id;
    listEl.appendChild(li);
  });
}

async function loadGeneralInfo() {
  const [sessionRes, scoreRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/buzzer/sessions`, { credentials: 'include' }),
    fetch(`${BACKEND_URL}/api/buzzer/leaderboard`, { credentials: 'include' }),
  ]);
  const container = document.getElementById('general-info');
  container.innerHTML = '';

  if (scoreRes.ok) {
    const { leaderboard } = await scoreRes.json();
    if (leaderboard.length > 0) {
      const listEl = document.createElement('ul');
      leaderboard.forEach((p) => {
        const li = document.createElement('li');
        li.textContent = `${p.users?.name || p.user_id}: ${p.score} Punkte`;
        listEl.appendChild(li);
      });
      container.appendChild(listEl);
    }
  }

  if (sessionRes.ok) {
    const { sessions: online } = await sessionRes.json();
    online?.forEach((u) => {
      const li = document.createElement('div');
      const color =
        u.users?.role === 'admin' ? 'text-red-600' : 'text-green-600';
      li.innerHTML = `<span class="${color}">${u.username}</span> – ${u.online ? 'online' : 'offline'}`;
      container.appendChild(li);
    });
  }
}

async function init() {
  const user = await checkUser();
  if (!user) return;
  currentUser = user;
  if (user.role === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
    document
      .getElementById('round-form')
      ?.addEventListener('submit', createRound);
    document
      .getElementById('end-round-btn')
      ?.addEventListener('click', endRound);
    document
      .getElementById('lock-round-btn')
      ?.addEventListener('click', lockRound);
    document
      .getElementById('start-kolo-btn')
      ?.addEventListener('click', startKolo);
    document
      .getElementById('kolo-correct-btn')
      ?.addEventListener('click', () => endKolo(true));
    document
      .getElementById('kolo-wrong-btn')
      ?.addEventListener('click', () => endKolo(false));
  }
  await loadRound();
  await loadParticipants();
  await loadGeneralInfo();
  await loadKolo();

  const evt = new EventSource(`${BACKEND_URL}/api/buzzer/events`, {
    withCredentials: true,
  });
  evt.addEventListener('buzz', () => {
    buzzerSound.currentTime = 0;
    buzzerSound.play().catch(() => {});
  });
  evt.addEventListener('unlock', () => {
    document.getElementById('buzz-btn').disabled = false;
    document.getElementById('skip-btn').disabled = false;
    loadKolo();
  });
  evt.addEventListener('lock', () => {
    document.getElementById('buzz-btn').disabled = true;
    document.getElementById('skip-btn').disabled = true;
  });

  document.getElementById('join-btn').addEventListener('click', joinRound);
  document.getElementById('buzz-btn').addEventListener('click', buzz);
  document.getElementById('skip-btn').addEventListener('click', skip);

  setInterval(loadParticipants, 5000);
  setInterval(loadGeneralInfo, 5000);
  setInterval(loadRound, 5000);
  setInterval(loadKolo, 5000);
  if (typeof startSessionCheck === 'function') startSessionCheck();
}

document.addEventListener('DOMContentLoaded', init);

async function joinRound() {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/join`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  const msgEl = document.getElementById('join-message');
  if (res.ok) {
    document.getElementById('join-btn').disabled = true;
    msgEl.textContent = 'Beigetreten';
    await loadParticipants();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Beitreten';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function lockRound(e) {
  e.preventDefault();
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round/lock`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'Runde geschlossen';
    await loadRound();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Schliessen';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function buzz() {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/buzz`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  if (res.ok) {
    document.getElementById('buzz-btn').disabled = true;
  }
}

async function skip() {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/skip`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  if (res.ok) {
    document.getElementById('skip-btn').disabled = true;
  }
}

async function createRound(e) {
  e.preventDefault();
  const bet = parseInt(document.getElementById('round-bet').value, 10);
  const limit = parseInt(document.getElementById('round-limit').value, 10);
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    body: JSON.stringify({ bet, points_limit: limit }),
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'Runde gestartet';
    await loadRound();
    await loadParticipants();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Start';
    if (data.detail) msgEl.textContent += `: ${data.detail}`;
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function endRound(e) {
  e.preventDefault();
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round/end`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'Runde beendet';
    await loadRound();
    await loadParticipants();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Beenden';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function startKolo(e) {
  e.preventDefault();
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/kolo`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'KOLO gestartet';
    await loadKolo();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Starten';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function endKolo(correct) {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/kolo/end`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
    body: JSON.stringify({ correct }),
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'KOLO beendet';
    await loadParticipants();
    await loadGeneralInfo();
    await loadKolo();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Beenden';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}
