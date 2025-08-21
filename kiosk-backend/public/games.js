// --- Make $ and showToast globally accessible ---
window.$ = function (id) { return document.getElementById(id); };
window.showToast = function (msg, type = 'success', duration = 3000, undoCallback = null) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = msg;
    toast.appendChild(span);
    if (undoCallback) {
        const btn = document.createElement('button');
        btn.textContent = 'Rückgängig';
        btn.className = 'ml-4 px-3 py-1 rounded bg-white/80 text-green-700 font-bold shadow hover:bg-green-100 transition text-xs';
        btn.onclick = () => {
            undoCallback();
            toast.classList.add('opacity-0');
        };
        toast.appendChild(btn);
    }
    toast.className = `fixed left-1/2 top-6 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-sm font-semibold transition-opacity duration-300 pointer-events-none ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white opacity-100`;
    if (!undoCallback) {
        setTimeout(() => {
            toast.classList.add('opacity-0');
        }, duration);
    }
};
async function heartbeat() {
    try {
        await fetch('/api/online-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                session_id: sessionStorage.getItem('games_session_id'),
                page: 'games',
                username: (JSON.parse(localStorage.getItem('user_profile') || '{}').name) || '',
                profile_image_url: (JSON.parse(localStorage.getItem('user_profile') || '{}').image) || ''
            })
        });
    } catch (e) { /* Fehler ignorieren */ }
}
window.heartbeat = heartbeat;

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
window.updateOnlineUI = updateOnlineUI;

// === Haupt-Initialisierung und UI-Logik ===
document.addEventListener('DOMContentLoaded', () => {
    // Routing: gameId = Spiel läuft, lobbyId = Warten auf Spielstart
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdFromUrl = urlParams.get('gameId');
    const lobbyIdFromUrl = urlParams.get('lobbyId');
    if (gameIdFromUrl) {
        // Spiel läuft: Spiel-UI anzeigen (hier ggf. eigene Logik einfügen)
        // ...
    } else if (lobbyIdFromUrl) {
        // Warten auf Spielstart: Zeige Wartescreen (hier ggf. eigene Logik einfügen)
        // ...
    } else {
        // Lobby-UI anzeigen
        const lobbyList = $("lobby-list");
        const createBtn = $("create-lobby-btn");
        const modal = $("lobby-modal");
        const closeBtn = $("lobby-modal-close");
        const form = $("lobby-form");
        // Modal-Logik
        if (createBtn && modal && closeBtn) {
            createBtn.addEventListener('click', () => { modal.classList.remove('hidden'); closeBtn.focus(); });
            closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); createBtn.focus(); });
            modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.add('hidden'); createBtn.focus(); } });
            document.addEventListener('keydown', (e) => { if (!modal.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { modal.classList.add('hidden'); createBtn.focus(); } });
        }
        // Lobby erstellen
        if (form && lobbyList) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const lobbySize = parseInt(form['lobbySize'].value, 10);
                const bet = parseFloat(form['bet'].value);
                const game = form['game'] ? form['game'].value : 'brain9';
                try {
                    const res = await fetch('/api/games/lobby', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ lobbySize, bet, game })
                    });
                    const data = await res.json();
                    if (res.ok && data.lobbyId) {
                        if (modal) modal.classList.add('hidden');
                        setTimeout(() => {
                            if (window.joinLobbyRoom) window.joinLobbyRoom(data.lobbyId);
                            window.location.href = '/games.html?lobbyId=' + encodeURIComponent(data.lobbyId);
                        }, 50);
                    } else {
                        showToast(data.error || 'Fehler beim Erstellen', 'error');
                    }
                } catch (err) {
                    showToast('Fehler beim Erstellen', 'error');
                }
            });
        }
        // Lobbys laden
        async function loadLobbies() {
            if (!lobbyList) return;
            try {
                const res = await fetch('/api/games/lobby', { credentials: 'include' });
                const data = await res.json();
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                if (Array.isArray(data.lobbies) && data.lobbies.length) {
                    window.lastLobbies = data.lobbies;
                    lobbyList.innerHTML = data.lobbies.map(lobby => {
                        const isInLobby = lobby.players.some(p => p.user_id === profile.id);
                        const isCreator = lobby.created_by === profile.id;
                        const gameName = lobby.game_type === 'brain9' ? 'Brain9' : lobby.game_type;
                        return `
                        <div class="bg-cyan-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow">
                            <div>
                                <div class="font-bold text-cyan-700 dark:text-cyan-300 text-lg flex items-center gap-2">
                                    ${gameName} Lobby #${lobby.id.slice(-4)}
                                    <span class="ml-2 text-xs font-normal text-gray-500">${lobby.players.length}/${lobby.lobby_size} Spieler</span>
                                </div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Einsatz: <span class="font-semibold">€${Number(lobby.bet).toFixed(2)}</span></div>
                                <div class="flex gap-2 mt-2">
                                    ${lobby.players.map(p => `<img src=\"${p.profile_image_url || ''}\" alt=\"\" class=\"w-8 h-8 rounded-full border\" />`).join('')}
                                </div>
                            </div>
                            <div class="flex gap-2 items-center">
                                ${(isInLobby || isCreator)
                                ? `<button class=\"open-lobby-btn btn-main\" data-id=\"${lobby.id}\">Lobby öffnen</button>`
                                : `<button class=\"join-lobby-btn btn-main\" data-id=\"${lobby.id}\">Beitreten</button>`}
                            </div>
                        </div>
                        `;
                    }).join('');
                } else {
                    lobbyList.innerHTML = `<div class=\"text-center text-gray-500 dark:text-gray-400 py-8\">
                        <svg xmlns='http://www.w3.org/2000/svg' class='w-12 h-12 mx-auto mb-2 text-cyan-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
                        <div class=\"font-semibold\">Noch keine Lobbys vorhanden.</div>
                        <div>Erstelle die erste Lobby mit dem Button oben!</div>
                    </div>`;
                }
            } catch {
                lobbyList.innerHTML = `<div class=\"text-center text-red-500 py-8\">Fehler beim Laden der Lobbys.</div>`;
            }
        }
        window.loadLobbies = loadLobbies;
        loadLobbies();
        setInterval(loadLobbies, 5000);
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
                    let errorMsg = '';
                    try { data = await res.json(); } catch { }
                    if (res.ok && data.gameId) {
                        const modal = document.querySelector('.lobby-detail-modal');
                        if (modal) modal.remove();
                        window.joinLobbyRoom && window.joinLobbyRoom(data.lobbyId);
                        setTimeout(() => {
                            window.location.href = '/games.html?lobbyId=' + encodeURIComponent(data.lobbyId);
                        }, 50);
                    } else if (res.ok) {
                        await loadLobbies();
                        const modal = document.querySelector('.lobby-detail-modal');
                        if (modal) modal.remove();
                        setTimeout(() => {
                            const lobby = (window.lastLobbies || []).find(l => l.players.some(p => p.user_id === (JSON.parse(localStorage.getItem('user_profile') || '{}').id)));
                            if (lobby) {
                                window.location.href = '/games.html?lobbyId=' + encodeURIComponent(lobby.id);
                            }
                        }, 200);
                    } else {
                        if (data && data.error) {
                            errorMsg = data.error;
                        } else {
                            errorMsg = `Fehler beim Beitreten (Status ${res.status})`;
                        }
                        showToast(errorMsg, 'error');
                        await loadLobbies();
                    }
                } catch (err) {
                    showToast('Netzwerkfehler beim Beitreten', 'error');
                } finally {
                    joinBtn.disabled = false;
                }
            } else if (openBtn) {
                const id = openBtn.dataset.id;
                const lobby = (window.lastLobbies || []).find(l => l.id === id);
                if (!lobby) { showToast('Lobby nicht gefunden', 'error'); return; }
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 lobby-detail-modal';
                modal.setAttribute('data-lobby-id', lobby.id);
                modal.innerHTML = `
                  <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl relative flex flex-col items-center">
                    <button class="absolute top-3 right-3 text-2xl text-gray-400 hover:text-cyan-500 focus:outline-none" id="close-lobby-detail">&times;</button>
                    <h2 class="text-xl font-bold mb-4 text-cyan-700 dark:text-cyan-300">${lobby.game_type === 'brain9' ? 'Brain9' : lobby.game_type} Lobby #${lobby.id.slice(-4)}</h2>
                    <div class="mb-2 text-gray-700 dark:text-gray-200">Einsatz: <b>€${Number(lobby.bet).toFixed(2)}</b></div>
                    <div class="mb-2 text-gray-700 dark:text-gray-200">Spieler:</div>
                    <div class="flex gap-2 mb-4 flex-wrap justify-center">
                      ${lobby.players.map(p => `<div class='flex flex-col items-center'><img src='${p.profile_image_url}' class='w-10 h-10 rounded-full border mb-1' /><span class='text-xs'>${p.name}</span></div>`).join('')}
                    </div>
                  </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('#close-lobby-detail').onclick = () => modal.remove();
            }
        });
        // Online-User-Button und Overlay
        const onlineBtn = $("games-online-btn");
        const onlineOverlay = $("games-online-overlay");
        const onlineClose = $("games-online-close");
        if (onlineBtn && onlineOverlay && onlineClose) {
            onlineBtn.addEventListener('click', () => { onlineOverlay.classList.remove('hidden'); onlineClose.focus(); });
            onlineClose.addEventListener('click', () => { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); });
            onlineOverlay.addEventListener('click', s => { if (s.target === onlineOverlay) { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); } });
            document.addEventListener('keydown', s => { if (!onlineOverlay.classList.contains('hidden') && (s.key === 'Escape' || s.key === 'Esc')) { onlineOverlay.classList.add('hidden'); onlineBtn.focus(); } });
        }
        // Online-User-Tracking
        window.heartbeat();
        window.updateOnlineUI();
        setInterval(() => { window.heartbeat(); window.updateOnlineUI(); }, 10000);
        window.addEventListener('beforeunload', () => { window.heartbeat(); });
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') { window.heartbeat(); window.updateOnlineUI(); }
        });
        // Socket.IO initialisieren, wenn verfügbar
        if (window.io) {
            const socket = window.io();
            window.joinLobbyRoom = function (lobbyId) {
                if (socket && lobbyId) socket.emit('joinLobby', lobbyId);
            };
            socket.on('lobbyUpdated', async () => { await loadLobbies(); });
        }
    }
});
