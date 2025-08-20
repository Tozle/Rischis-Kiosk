// games.js – Best Practice Refactor
import { $, showToast } from './utils/frontend.js';
document.addEventListener('DOMContentLoaded', () => {
    // --- Online-User-Tracking (Backend) ---

    const PROFILE_KEY = 'user_profile';
    let SESSION_ID = sessionStorage.getItem('games_session_id');
    if (!SESSION_ID) {
        SESSION_ID = Math.random().toString(36).slice(2);
        sessionStorage.setItem('games_session_id', SESSION_ID);
    }
    let profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    async function ensureProfile() {
        if (!profile.name || !profile.image) {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                const data = await res.json();
                if (data?.loggedIn && data.user) {
                    profile = {
                        name: data.user.name || '',
                        image: data.user.profile_image_url || ''
                    };
                    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
                }
            } catch {}
        }
    }
    // Profil sicherstellen, dann weitermachen
    ensureProfile().then(() => {
        const name = profile.name || 'Gast-' + SESSION_ID.slice(-4);
        const image = profile.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name);

        async function heartbeat() {
            try {
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
            } catch (e) { /* Fehler ignorieren */ }
        }

        async function removeOnline() {
            try {
                await fetch('/api/online-users', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ session_id: SESSION_ID })
                });
            } catch (e) { /* Fehler ignorieren */ }
        }

        async function fetchOnlineUsers() {
            try {
                const res = await fetch('/api/online-users?page=games', { credentials: 'include' });
                if (!res.ok) return [];
                const data = await res.json();
                return data.users || [];
            } catch (e) {
                return [];
            }
        }

        async function updateOnlineUI() {
            const users = await fetchOnlineUsers();
            const unique = users.filter((u, i, arr) => arr.findIndex(x => x.session_id === u.session_id) === i);
            const onlineCount = $("games-online-count");
            if (onlineCount) onlineCount.textContent = unique.length;
            const onlineList = $("games-online-list");
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
        const createBtn = $("create-lobby-btn");
        const modal = $("lobby-modal");
        const closeBtn = $("lobby-modal-close");
        const form = $("lobby-form");
        if (createBtn && modal && closeBtn) {
            createBtn.addEventListener('click', () => { modal.classList.remove('hidden'); closeBtn.focus(); });
            closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); createBtn.focus(); });
            modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.add('hidden'); createBtn.focus(); } });
            document.addEventListener('keydown', (e) => { if (!modal.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { modal.classList.add('hidden'); createBtn.focus(); } });
        }
        // --- Lobby-Logik ---
        const lobbyList = $("lobby-list");
        const gameSelect = $("game-select");
        if (form && lobbyList) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                // Nur ein Spieltyp verfügbar
                const lobbySize = parseInt(form.lobby_size.value, 10);
                const bet = parseFloat(form.lobby_bet.value);
                try {
                    const res = await fetch('/api/games/lobby', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ lobbySize, bet })
                    });
                    const data = await res.json();
                    if (res.ok && data.lobbyId) {
                        showToast('Lobby erstellt!');
                        modal.classList.add('hidden');
                        createBtn.focus();
                        await loadLobbies();
                    } else {
                        showToast(data.error || 'Fehler beim Erstellen', 'error');
                    }
                } catch (err) {
                    showToast('Fehler beim Erstellen', 'error');
                }
            });
        }

        async function loadLobbies() {
            // MVP: Hole alle offenen Lobbys (aus Backend, hier Demo: alle)
            try {
                const res = await fetch('/api/games/lobby', { credentials: 'include' });
                const data = await res.json();
                if (Array.isArray(data.lobbies) && data.lobbies.length) {
                    lobbyList.innerHTML = data.lobbies.map(lobby => `
                        <div class="bg-cyan-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow">
                            <div>
                                <div class="font-bold text-cyan-700 dark:text-cyan-300 text-lg flex items-center gap-2">
                                    Lobby #${lobby.id.slice(-4)}
                                    <span class="ml-2 text-xs font-normal text-gray-500">${lobby.players.length}/${lobby.lobbySize} Spieler</span>
                                </div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Einsatz: <span class="font-semibold">€${lobby.bet.toFixed(2)}</span></div>
                                <div class="flex gap-2 mt-2">
                                    ${lobby.players.map(p => `<img src="${p.profile_image_url}" alt="${p.name}" class="w-8 h-8 rounded-full border" title="${p.name}" />`).join('')}
                                </div>
                            </div>
                            <div class="flex gap-2 items-center">
                                <button class="join-lobby-btn btn-main" data-id="${lobby.id}">Beitreten</button>
                                ${lobby.players.length >= 2 && !lobby.started ? `<button class="start-lobby-btn btn-main bg-green-600 hover:bg-green-700" data-id="${lobby.id}">Starten</button>` : ''}
                            </div>
                        </div>
                    `).join('');
                } else {
                    lobbyList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-8">
                        <svg xmlns='http://www.w3.org/2000/svg' class='w-12 h-12 mx-auto mb-2 text-cyan-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
                        <div class="font-semibold">Noch keine Lobbys vorhanden.</div>
                        <div>Erstelle die erste Lobby mit dem Button oben!</div>
                    </div>`;
                }
            } catch {
                lobbyList.innerHTML = `<div class="text-center text-red-500 py-8">Fehler beim Laden der Lobbys.</div>`;
            }
        }

        // Initiales Laden
        loadLobbies();

        // Event-Delegation für Join/Start
        lobbyList.addEventListener('click', async (e) => {
            const joinBtn = e.target.closest('.join-lobby-btn');
            const startBtn = e.target.closest('.start-lobby-btn');
            if (joinBtn) {
                const id = joinBtn.dataset.id;
                try {
                    const res = await fetch(`/api/games/lobby/${id}/join`, { method: 'POST', credentials: 'include' });
                    const data = await res.json();
                    if (res.ok) {
                        showToast('Lobby beigetreten!');
                        await loadLobbies();
                    } else {
                        showToast(data.error || 'Fehler beim Beitreten', 'error');
                    }
                } catch {
                    showToast('Fehler beim Beitreten', 'error');
                }
            }
            if (startBtn) {
                const id = startBtn.dataset.id;
                try {
                    const res = await fetch(`/api/games/lobby/${id}/start`, { method: 'POST', credentials: 'include' });
                    const data = await res.json();
                    if (res.ok && data.gameId) {
                        showToast('Spiel gestartet!');
                        // TODO: Game-UI anzeigen
                    } else {
                        showToast(data.error || 'Fehler beim Starten', 'error');
                    }
                } catch {
                    showToast('Fehler beim Starten', 'error');
                }
            }
        });

        // --- Online-User-Button und Overlay steuern ---
        const onlineBtn = $("games-online-btn");
        const onlineOverlay = $("games-online-overlay");
        const onlineClose = $("games-online-close");
        if (onlineBtn && onlineOverlay && onlineClose) {
            onlineBtn.addEventListener('click', () => { onlineOverlay.classList.remove('hidden'); onlineClose.focus(); });
            onlineClose.addEventListener('click', () => { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); });
            onlineOverlay.addEventListener('click', s => { if (s.target === onlineOverlay) { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); } });
            document.addEventListener('keydown', s => { if (!onlineOverlay.classList.contains('hidden') && (s.key === 'Escape' || s.key === 'Esc')) { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); } });
        }
    });

    async function heartbeat() {
        try {
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
        } catch (e) { /* Fehler ignorieren */ }
    }

    async function removeOnline() {
        try {
            await fetch('/api/online-users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ session_id: SESSION_ID })
            });
        } catch (e) { /* Fehler ignorieren */ }
    }

    async function fetchOnlineUsers() {
        try {
            const res = await fetch('/api/online-users?page=games', { credentials: 'include' });
            if (!res.ok) return [];
            const data = await res.json();
            return data.users || [];
        } catch (e) {
            return [];
        }
    }

    async function updateOnlineUI() {
        const users = await fetchOnlineUsers();
        const unique = users.filter((u, i, arr) => arr.findIndex(x => x.session_id === u.session_id) === i);
        const onlineCount = $("games-online-count");
        if (onlineCount) onlineCount.textContent = unique.length;
        const onlineList = $("games-online-list");
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
    const createBtn = $("create-lobby-btn");
    const modal = $("lobby-modal");
    const closeBtn = $("lobby-modal-close");
    const form = $("lobby-form");
    if (createBtn && modal && closeBtn) {
        createBtn.addEventListener('click', () => { modal.classList.remove('hidden'); closeBtn.focus(); });
        closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); createBtn.focus(); });
        modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.add('hidden'); createBtn.focus(); } });
        document.addEventListener('keydown', (e) => { if (!modal.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { modal.classList.add('hidden'); createBtn.focus(); } });
    }
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Es sind aktuell noch keine Spiele verfügbar.', 'info');
            modal.classList.add('hidden');
            createBtn.focus();
        });
    }

    // --- Online-User-Button und Overlay steuern ---
    const onlineBtn = $("games-online-btn");
    const onlineOverlay = $("games-online-overlay");
    const onlineClose = $("games-online-close");
    if (onlineBtn && onlineOverlay && onlineClose) {
        onlineBtn.addEventListener('click', () => { onlineOverlay.classList.remove('hidden'); onlineClose.focus(); });
        onlineClose.addEventListener('click', () => { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); });
        onlineOverlay.addEventListener('click', s => { if (s.target === onlineOverlay) { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); } });
        document.addEventListener('keydown', s => { if (!onlineOverlay.classList.contains('hidden') && (s.key === 'Escape' || s.key === 'Esc')) { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); } });
    }
});
