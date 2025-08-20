document.addEventListener('DOMContentLoaded', () => {
    // --- Online-User-Tracking (Backend) ---
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
        console.log('Sende Heartbeat...');
        const res = await fetch('/api/online-users', {
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
        const text = await res.text();
        console.log('Heartbeat Response:', res.status, text);
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
        const text = await res.text();
        console.log('Fetch Online Users Response:', res.status, text);
        if (!res.ok) return [];
        try {
            const data = JSON.parse(text);
            return data.users || [];
        } catch (e) {
            console.error('Fehler beim Parsen der Online-User-Antwort:', e);
            return [];
        }
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

    // --- Modal für Lobby-Erstellung ---
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

    // --- Online-User-Button und Overlay steuern ---
    const t = document.getElementById('games-online-btn');
    const e = document.getElementById('games-online-overlay');
    const n = document.getElementById('games-online-close');
    if (t && e && n) {
        t.addEventListener('click', () => { e.classList.remove('hidden'); n.focus(); });
        n.addEventListener('click', () => { e.classList.add('hidden'); t.focus(); });
        e.addEventListener('click', s => { if (s.target === e) { e.classList.add('hidden'); t.focus(); } });
        document.addEventListener('keydown', s => { if (!e.classList.contains('hidden') && (s.key === 'Escape' || s.key === 'Esc')) { e.classList.add('hidden'); t.focus(); } });
    }
});
