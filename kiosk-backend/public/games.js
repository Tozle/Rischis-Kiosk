// Brain9 Game-UI anzeigen und Spiellogik
let brain9PollInterval = null;
function showGameModal(gameId) {
    const modal = $("game-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    pollAndRenderGame(gameId);
    if (brain9PollInterval) clearInterval(brain9PollInterval);
    brain9PollInterval = setInterval(() => pollAndRenderGame(gameId), 2000);
    // Close-Button
    const closeBtn = $("game-modal-close");
    if (closeBtn) closeBtn.onclick = () => { modal.classList.add("hidden"); clearInterval(brain9PollInterval); };
}

async function pollAndRenderGame(gameId) {
    try {
        const res = await fetch(`/api/games/game/${gameId}`, { credentials: 'include' });
        if (!res.ok) return;
        const game = await res.json();
        renderBrain9Game(game);
    } catch { }
}

function renderBrain9Game(game) {
    const status = $("game-status");
    const grid = $("simon-grid");
    const players = $("game-players");
    if (!status || !grid || !players) return;
    // Spieler anzeigen
    players.innerHTML = game.players.map(p => `<div class="flex flex-col items-center ${game.activePlayers.includes(p.id) ? '' : 'opacity-40'}">
        <img src="${p.profile_image_url}" alt="${p.name}" class="w-8 h-8 rounded-full border mb-1" />
        <span class="text-xs">${p.name}</span>
    </div>`).join('');
    // Status
    if (game.finished) {
        const winner = game.players.find(p => p.id === game.winner);
        status.innerHTML = winner ? `<span class="text-green-600 font-bold">${winner.name} gewinnt Brain9!</span>` : 'Spiel beendet.';
        grid.innerHTML = '';
        return;
    }
    const currentPlayer = game.players.find(p => p.id === game.activePlayers[game.turn % game.activePlayers.length]);
    status.innerHTML = `<span class="font-semibold">Am Zug:</span> <span class="text-cyan-600 font-bold">${currentPlayer ? currentPlayer.name : ''}</span> <span class="ml-2 text-xs">(Runde ${game.sequence.length + 1})</span>`;
    // 3x3 Grid
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'w-16 h-16 rounded-lg bg-cyan-200 dark:bg-cyan-800 border-2 border-cyan-400 text-2xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 m-1 transition hover:bg-cyan-300';
        btn.textContent = i + 1;
        btn.setAttribute('aria-label', `Feld ${i + 1}`);
        btn.disabled = !isMyTurn(game);
        btn.onclick = () => makeBrain9Move(game.id, i);
        grid.appendChild(btn);
    }
}

function isMyTurn(game) {
    // Hole eigene User-ID (aus /api/auth/me)
    // Annahme: User ist eingeloggt und id ist in localStorage
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    if (!profile || !profile.id) return false;
    const currentPlayerId = game.activePlayers[game.turn % game.activePlayers.length];
    return profile.id === currentPlayerId;
}

async function makeBrain9Move(gameId, buttonIndex) {
    try {
        const res = await fetch(`/api/games/game/${gameId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ buttonIndex })
        });
        const data = await res.json();
        if (data.error) {
            showToast(data.error, 'error');
        }
        pollAndRenderGame(gameId);
    } catch {
        showToast('Fehler beim Zug.', 'error');
    }
}
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
            } catch { }
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
                const lobbySize = parseInt(form['lobby-size'].value, 10);
                const bet = parseFloat(form['lobby-bet'].value);
                const game = form['game-select'] ? form['game-select'].value : 'brain9';
                try {
                    const res = await fetch('/api/games/lobby', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ lobbySize, bet, game })
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
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                if (Array.isArray(data.lobbies) && data.lobbies.length) {
                    lobbyList.innerHTML = data.lobbies.map(lobby => {
                        const isInLobby = lobby.players.some(p => p.user_id === profile.id);
                        return `
                        <div class="bg-cyan-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow">
                            <div>
                                <div class="font-bold text-cyan-700 dark:text-cyan-300 text-lg flex items-center gap-2">
                                    Lobby #${lobby.id.slice(-4)}
                                    <span class="ml-2 text-xs font-normal text-gray-500">${lobby.players.length}/${lobby.lobby_size} Spieler</span>
                                </div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Einsatz: <span class="font-semibold">€${Number(lobby.bet).toFixed(2)}</span></div>
                                <div class="flex gap-2 mt-2">
                                    ${lobby.players.map(p => `<img src="${p.profile_image_url || ''}" alt="" class="w-8 h-8 rounded-full border" />`).join('')}
                                </div>
                            </div>
                            <div class="flex gap-2 items-center">
                                ${isInLobby
                                    ? `<button class="open-lobby-btn btn-main" data-id="${lobby.id}">Lobby öffnen</button>`
                                    : `<button class="join-lobby-btn btn-main" data-id="${lobby.id}">Beitreten</button>`}
                            </div>
                        </div>
                        `;
                    }).join('');
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
            const openBtn = e.target.closest('.open-lobby-btn');
            if (joinBtn) {
                const id = joinBtn.dataset.id;
                joinBtn.disabled = true;
                try {
                    const res = await fetch(`/api/games/lobby/${id}/join`, { method: 'POST', credentials: 'include' });
                    let data = {};
                    try { data = await res.json(); } catch {}
                    if (res.ok && data.gameId) {
                        showToast('Lobby voll – Brain9 startet!');
                        showGameModal(data.gameId);
                    } else if (res.ok) {
                        showToast('Lobby beigetreten!');
                        await loadLobbies();
                    } else if (res.status === 400) {
                        showToast(data.error || 'Du bist bereits in dieser Lobby oder sie ist voll.', 'error');
                        await loadLobbies();
                    } else if (res.status === 404) {
                        showToast('Lobby nicht gefunden (404)', 'error');
                        await loadLobbies();
                    } else {
                        showToast(data.error || 'Fehler beim Beitreten', 'error');
                    }
                } catch {
                    showToast('Netzwerkfehler beim Beitreten', 'error');
                } finally {
                    joinBtn.disabled = false;
                }
            } else if (openBtn) {
                // Modal für eigene/beigetretene Lobby öffnen
                showToast('Du bist in dieser Lobby!');
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
        // Nur der echte Submit-Handler bleibt aktiv (siehe weiter oben)
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
