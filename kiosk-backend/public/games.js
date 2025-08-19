// --- Spieler auf der Games-Seite live anzeigen ---
(function trackGamesPageUsers() {
  // Einfache Demo: Jeder, der die Seite lädt, wird als "online" gezählt (nur im LocalStorage, kein echtes Backend)
  const STORAGE_KEY = 'games_online_users';
  const PROFILE_KEY = 'user_profile'; // Annahme: { name, image }
  const SESSION_ID = Math.random().toString(36).slice(2);
  const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  if (!profile.name) {
    // Dummy-Name, falls nicht gesetzt
    profile.name = 'Gast-' + SESSION_ID.slice(-4);
  }
  // Simuliere Profilbild
  if (!profile.image) {
    profile.image = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.name);
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function setUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  function addUser() {
    let users = getUsers().filter(u => u.session !== SESSION_ID);
    users.push({ name: profile.name, image: profile.image, session: SESSION_ID, ts: Date.now() });
    setUsers(users);
  }
  function removeUser() {
    let users = getUsers().filter(u => u.session !== SESSION_ID);
    setUsers(users);
  }
  // Beim Laden hinzufügen
  addUser();
  // Beim Verlassen entfernen
  window.addEventListener('beforeunload', removeUser);
  // Alle 20s aktualisieren (und alte Einträge entfernen)
  setInterval(() => {
    let users = getUsers().filter(u => Date.now() - u.ts < 60000);
    setUsers(users);
    addUser();
    // Update UI
    updateGamesOnlineUI(users);
  }, 20000);
  // Initial UI-Update
  updateGamesOnlineUI(getUsers());

  // UI-Update für Online-Anzeige und Overlay
  function updateGamesOnlineUI(users) {
    // Nur eindeutige Sessions
    const unique = users.filter((u, i, arr) => arr.findIndex(x => x.session === u.session) === i);
    // Update Counter
    const onlineCount = document.getElementById('games-online-count');
    if (onlineCount) onlineCount.textContent = unique.length;
    // Update Overlay
    const onlineList = document.getElementById('games-online-list');
    if (onlineList) {
      if (!unique.length) {
        onlineList.innerHTML = `<div class=\"text-center text-gray-500 dark:text-gray-400 py-4\">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 mx-auto mb-2 text-cyan-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
          <div class=\"font-semibold\">Noch keine Spieler online.</div>
        </div>`;
      } else {
        onlineList.innerHTML = '<div class=\"flex flex-wrap gap-4 justify-center\">' +
          unique.map(u => `<div class=\"flex flex-col items-center\">
            <img src=\"${u.image}\" alt=\"${u.name}\" class=\"w-12 h-12 rounded-full border border-gray-300 object-cover mb-1\" style=\"background:#eee;\" />
            <span class=\"text-xs font-medium\">${u.name}</span>
          </div>`).join('') + '</div>';
      }
    }
  }
})();
// Online-Spiele-Anzeige & Overlay
document.addEventListener('DOMContentLoaded', () => {
  const onlineBtn = document.getElementById('games-online-btn');
  const onlineOverlay = document.getElementById('games-online-overlay');
  const onlineClose = document.getElementById('games-online-close');
  const onlineCount = document.getElementById('games-online-count');
  const onlineList = document.getElementById('games-online-list');

  // Platzhalter: keine Lobbys/Spieler
  let lobbys = [];
  // Beispiel für spätere Erweiterung:
  // lobbys = [{players: [{name: 'Tom', image: 'https://...'}]}]

  function updateOnlineCount() {
    // Zähle alle Spieler in allen Lobbys (Platzhalter: 0)
    let count = 0;
    lobbys.forEach(lobby => {
      count += (lobby.players?.length || 0);
    });
    onlineCount.textContent = count;
  }

  function renderOnlineList() {
    if (!lobbys.length || lobbys.every(l => !l.players?.length)) {
      onlineList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4">
        <svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 mx-auto mb-2 text-cyan-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
        <div class="font-semibold">Noch keine Spieler online.</div>
      </div>`;
      return;
    }
    let html = '';
    lobbys.forEach(lobby => {
      if (lobby.players?.length) {
        html += '<div class="mb-2"><div class="font-semibold text-cyan-700 dark:text-cyan-300 mb-1">Lobby</div>';
        html += '<div class="flex flex-wrap gap-4">';
        lobby.players.forEach(player => {
          html += `<div class="flex flex-col items-center">
            <img src="${player.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name)}" alt="${player.name}" class="w-12 h-12 rounded-full border border-gray-300 object-cover mb-1" style="background:#eee;" />
            <span class="text-xs font-medium">${player.name}</span>
          </div>`;
        });
        html += '</div></div>';
      }
    });
    onlineList.innerHTML = html;
  }

  if (onlineBtn && onlineOverlay && onlineClose) {
    onlineBtn.addEventListener('click', () => {
      renderOnlineList();
      onlineOverlay.classList.remove('hidden');
      onlineClose.focus();
    });
    onlineClose.addEventListener('click', () => {
      onlineOverlay.classList.add('hidden');
      onlineBtn.focus();
    });
    onlineOverlay.addEventListener('click', (e) => {
      if (e.target === onlineOverlay) {
        onlineOverlay.classList.add('hidden');
        onlineBtn.focus();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (!onlineOverlay.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) {
        onlineOverlay.classList.add('hidden');
        onlineBtn.focus();
      }
    });
    updateOnlineCount();
  }
});
// games.js
// Öffnet und schließt das Modal für neue Lobbys

document.addEventListener('DOMContentLoaded', () => {
  const createBtn = document.getElementById('create-lobby-btn');
  const modal = document.getElementById('lobby-modal');
  const closeBtn = document.getElementById('lobby-modal-close');
  const form = document.getElementById('lobby-form');

  if (createBtn && modal && closeBtn) {
    createBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      closeBtn.focus();
    });
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      createBtn.focus();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        createBtn.focus();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) {
        modal.classList.add('hidden');
        createBtn.focus();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Noch keine Spiele verfügbar, daher keine Lobby-Erstellung
      alert('Es sind aktuell noch keine Spiele verfügbar.');
      modal.classList.add('hidden');
      createBtn.focus();
    });
  }
});
