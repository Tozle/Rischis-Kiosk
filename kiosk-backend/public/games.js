// --- Spieler auf der Games-Seite live anzeigen ---
(function trackGamesPageUsers() {
    // Einfache Demo: Jeder, der die Seite lädt, wird als "online" gezählt (nur im LocalStorage, kein echtes Backend)
    const STORAGE_KEY = 'games_online_users';
    const PROFILE_KEY = 'user_profile'; // Annahme: { name, image }
    // Session-ID pro Tab, bleibt für die Dauer des Tabs gleich
    let SESSION_ID = sessionStorage.getItem('games_session_id');
    if (!SESSION_ID) {
        SESSION_ID = Math.random().toString(36).slice(2);
        sessionStorage.setItem('games_session_id', SESSION_ID);
    }
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
    // Beim Laden hinzufügen und UI sofort aktualisieren
    // --- Spieler auf der Games-Seite live anzeigen (Supabase/Backend) ---
    (function trackGamesPageUsersBackend() {
        const PROFILE_KEY = 'user_profile';
        let SESSION_ID = sessionStorage.getItem('games_session_id');
        if (!SESSION_ID) {
            SESSION_ID = Math.random().toString(36).slice(2);
            sessionStorage.setItem('games_session_id', SESSION_ID);
        }
        const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
        const name = profile.name || 'Gast-' + SESSION_ID.slice(-4);
        const image = profile.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name);

        async function heartbeat() {
            await fetch('/api/online-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    session_id: SESSION_ID,
                    page: 'games',
                    username: name,
                    profile_image_url: image
                })
            });
        }
        async function removeOnline() {
            await fetch('/api/online-users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ session_id: SESSION_ID })
            });
        }
        async function fetchOnlineUsers() {
            const res = await fetch('/api/online-users?page=games', { credentials: 'include' });
            if (!res.ok) return [];
            const data = await res.json();
            return data.users || [];
        }
        async function updateOnlineUI() {
            const users = await fetchOnlineUsers();
            const unique = users.filter((u, i, arr) => arr.findIndex(x => x.session_id === u.session_id) === i);
            const onlineCount = document.getElementById('games-online-count');
            if (onlineCount) onlineCount.textContent = unique.length;
            const onlineList = document.getElementById('games-online-list');
            if (onlineList) {
                if (!unique.length) {
                    onlineList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4">
            <svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 mx-auto mb-2 text-cyan-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
            <div class="font-semibold">Noch keine Spieler online.</div>
          </div>`;
                } else {
                    onlineList.innerHTML = '<div class="flex flex-wrap gap-4 justify-center">' +
                        unique.map(u => `<div class="flex flex-col items-center">
              <img src="${u.profile_image_url}" alt="${u.username}" class="w-12 h-12 rounded-full border border-gray-300 object-cover mb-1" style="background:#eee;" />
              <span class="text-xs font-medium">${u.username}</span>
            </div>`).join('') + '</div>';
                }
            }
        }
        // Initial heartbeat und UI
        heartbeat();
        updateOnlineUI();
        // Alle 10s heartbeat und UI
        const interval = setInterval(() => { heartbeat(); updateOnlineUI(); }, 10000);
        // Beim Verlassen austragen
        window.addEventListener('beforeunload', () => { removeOnline(); clearInterval(interval); });
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') removeOnline();
      if (document.visibilityState === 'visible') { heartbeat(); updateOnlineUI(); }
    });
  })();

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

// Online-User-Button und Overlay steuern
document.addEventListener('DOMContentLoaded', () => {
  const onlineBtn = document.getElementById('games-online-btn');
  const onlineOverlay = document.getElementById('games-online-overlay');
  const onlineClose = document.getElementById('games-online-close');

  if (onlineBtn && onlineOverlay && onlineClose) {
    onlineBtn.addEventListener('click', () => {
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
  }
});
