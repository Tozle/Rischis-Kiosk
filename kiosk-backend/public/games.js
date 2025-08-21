window._gamesjs_loaded = true;
console.log("games.js loaded!");
window.onerror = function (msg, url, line, col, error) {
    console.error("Global JS-Error:", msg, "at", url + ":" + line + ":" + col, error);
};
try { console.log('games.js: nach onerror'); } catch (e) { console.error('Block1', e); }
// Hilfsfunktionen für Browser-Kompatibilität
function $(id) {

    mainContent.innerHTML = `
                <h2 class="text-xl font-bold mb-4 text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                    <svg xmlns='http://www.w3.org/2000/svg' class='w-6 h-6 text-cyan-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
                    </svg>
                    Spielrunde
                </h2>
                <div id="game-status" class="mb-4 text-center text-base font-medium text-gray-700 dark:text-gray-200"></div>
                <div id="simon-grid" class="grid grid-cols-3 gap-3 mb-4" aria-label="Simon Says Spielfeld" role="grid"></div>
                <div id="game-players" class="flex flex-wrap gap-2 justify-center mb-2"></div>
                <div id="game-actions" class="flex gap-2 justify-center"></div>
                <div id="game-ready-status" class="flex flex-col items-center mt-2"></div>
            `;
    // Nach dem Einfügen: DOM-Elemente neu holen und erst dann erneut rendern
    requestAnimationFrame(() => {
        // Nach DOM-Update: Elemente neu holen
        status = $("game-status");
        grid = $("simon-grid");
        players = $("game-players");
        readyStatus = $("game-ready-status");
        if (!status || !grid || !players || !readyStatus) {
            // Versuche, das Spiel-UI dynamisch zu erzeugen, falls es fehlt
            const mainContent = document.getElementById('main-content');
            if (mainContent && !window._brain9_ui_injected) {
                window._brain9_ui_injected = true;
                mainContent.innerHTML = `
                            <h2 class="text-xl font-bold mb-4 text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                                <svg xmlns='http://www.w3.org/2000/svg' class='w-6 h-6 text-cyan-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
                                </svg>
                                Spielrunde
                            </h2>
                            <div id="game-status" class="mb-4 text-center text-base font-medium text-gray-700 dark:text-gray-200"></div>
                            <div id="simon-grid" class="grid grid-cols-3 gap-3 mb-4" aria-label="Simon Says Spielfeld" role="grid"></div>
                            <div id="game-players" class="flex flex-wrap gap-2 justify-center mb-2"></div>
                            <div id="game-actions" class="flex gap-2 justify-center"></div>
                            <div id="game-ready-status" class="flex flex-col items-center mt-2"></div>
                        `;
                // Nach dem Einfügen: DOM-Elemente neu holen und erst dann erneut rendern
                requestAnimationFrame(() => {
                    // Nach DOM-Update: Elemente neu holen
                    status = $("game-status");
                    grid = $("simon-grid");
                    players = $("game-players");
                    readyStatus = $("game-ready-status");
                    if (status && grid && players && readyStatus) {
                        renderBrain9Game(game);
                    } else {
                        window.showToast && window.showToast('Fehler: Spiel-UI konnte nicht erzeugt werden!', 'error');
                        if (!status) console.error('game-status Element fehlt!');
                        if (!grid) console.error('simon-grid Element fehlt!');
                        if (!players) console.error('game-players Element fehlt!');
                        if (!readyStatus) console.error('game-ready-status Element fehlt!');
                    }
                });
            } else if (!mainContent) {
                window.showToast && window.showToast('Fehler: Hauptbereich (main-content) nicht gefunden!', 'error');
                console.error('Game-UI konnte nicht erzeugt werden: main-content fehlt im DOM.');
            }
        } else {
            window._brain9_ui_injected = false;
        }
    }); // Ende requestAnimationFrame
}
if (readyStatus) {
    readyStatus.innerHTML = '';
} else {
    console.error('readyStatus-Element nicht gefunden, kann Ready-Button nicht anzeigen.');
}
// Status
if (game.finished) {
    const winner = game.players.find(p => p.id === game.winner);
    status.innerHTML = winner ? `<span class="text-green-600 font-bold">${winner.name} gewinnt Brain9!</span>` : 'Spiel beendet.';
    grid.innerHTML = '';
}
// ...restlicher Code der Funktion...

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
// Entferne alle ES6-Imports, nutze stattdessen window.$ und window.showToast

// === SOCKET.IO Echtzeit-Events ===
// Socket.IO-Client-Initialisierung und Listener ganz ans Ende verschoben

document.addEventListener('DOMContentLoaded', () => {
    // Debug: Funktionen global machen
    window.loadLobbies = loadLobbies;
    window.heartbeat = heartbeat;
    window.updateOnlineUI = updateOnlineUI;
    // Routing: gameId = Spiel läuft, lobbyId = Warten auf Spielstart
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdFromUrl = urlParams.get('gameId');
    const lobbyIdFromUrl = urlParams.get('lobbyId');
    if (gameIdFromUrl) {
        // Spiel läuft: Spiel-UI anzeigen
        if (window.io) {
            const socket = window.io();
            socket.emit('joinLobby', gameIdFromUrl);
        }
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                    <h2 class="text-xl font-bold mb-4 text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                        <svg xmlns='http://www.w3.org/2000/svg' class='w-6 h-6 text-cyan-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
                        </svg>
                        Spielrunde
                    </h2>
                    <div id="game-status" class="mb-4 text-center text-base font-medium text-gray-700 dark:text-gray-200"></div>
                    <div id="simon-grid" class="grid grid-cols-3 gap-3 mb-4" aria-label="Simon Says Spielfeld" role="grid"></div>
                    <div id="game-players" class="flex flex-wrap gap-2 justify-center mb-2"></div>
                    <div id="game-actions" class="flex gap-2 justify-center"></div>
                    <div id="game-ready-status" class="flex flex-col items-center mt-2"></div>
                `;
            setTimeout(() => {
                pollAndRenderGame(gameIdFromUrl);
            }, 0);
        }
        if (brain9PollInterval) clearInterval(brain9PollInterval);
        brain9PollInterval = setInterval(() => pollAndRenderGame(gameIdFromUrl), 2000);
        // Lobby-UI ausblenden
        const lobbyList = document.getElementById('lobby-list');
        if (lobbyList) lobbyList.style.display = 'none';
        const createBtn = document.getElementById('create-lobby-btn');
        if (createBtn) createBtn.style.display = 'none';
    } else if (lobbyIdFromUrl) {
        // Warten auf Spielstart: Zeige Wartescreen
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[40vh]">
                    <div class="text-2xl font-bold text-cyan-700 dark:text-cyan-300 mb-4">Warte auf Spielstart...</div>
                    <div class="text-base text-gray-600 dark:text-gray-300 mb-2">Sobald die Lobby voll ist, startet das Spiel automatisch.</div>
                    <div id="lobby-wait-spinner" class="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-400 border-opacity-50"></div>
                </div>
            `;
        }
        // Socket-Listener für Spielstart
        if (window.io) {
            const socket = window.io();
            socket.emit('joinLobby', lobbyIdFromUrl);
            socket.on('gameStarted', (game) => {
                if (game && game.id) {
                    // Weiterleitung auf ?gameId=...
                    window.location.href = window.location.pathname + '?gameId=' + game.id;
                }
            });
        }
        // Lobby-UI ausblenden
        const lobbyList = document.getElementById('lobby-list');
        if (lobbyList) lobbyList.style.display = 'none';
        const createBtn = document.getElementById('create-lobby-btn');
        if (createBtn) createBtn.style.display = 'none';
    } else {
        // Wenn KEIN Spiel läuft, stelle sicher, dass Lobby-UI sichtbar ist und KEIN Spiel gerendert wird
        const lobbyList = document.getElementById('lobby-list');
        if (lobbyList) lobbyList.style.display = '';
        const createBtn = document.getElementById('create-lobby-btn');
        if (createBtn) createBtn.style.display = '';
        // Entferne ggf. Spiel-UI aus main-content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Hier könnte man die Lobby-UI rendern, falls nötig
            // mainContent.innerHTML = ...
        }
    }
    // --- Online-User-Tracking (Backend) ---

    const PROFILE_KEY = 'user_profile';
    let SESSION_ID = sessionStorage.getItem('games_session_id');
    if (!SESSION_ID) {
        SESSION_ID = Math.random().toString(36).slice(2);
        sessionStorage.setItem('games_session_id', SESSION_ID);
    }
    let profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    async function ensureProfile() {
        if (!profile.id || !profile.name || !profile.image) {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                const data = await res.json();
                if (data?.loggedIn && data.user) {
                    profile = {
                        id: data.user.id,
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
        window.heartbeat();
        window.updateOnlineUI();
        // Alle 10s heartbeat und UI
        const interval = setInterval(() => { window.heartbeat(); window.updateOnlineUI(); }, 10000);
        // Beim Verlassen austragen
        window.addEventListener('beforeunload', () => { removeOnline(); clearInterval(interval); });
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') removeOnline();
            if (document.visibilityState === 'visible') { window.heartbeat(); window.updateOnlineUI(); }
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
                        // Modal sofort schließen, dann Weiterleitung
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

        async function loadLobbies() {
            // MVP: Hole alle offenen Lobbys (aus Backend, hier Demo: alle)
            try {
                const res = await fetch('/api/games/lobby', { credentials: 'include' });
                const data = await res.json();
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                if (Array.isArray(data.lobbies) && data.lobbies.length) {
                    window.lastLobbies = data.lobbies;
                    lobbyList.innerHTML = data.lobbies.map(lobby => {
                        const isInLobby = lobby.players.some(p => p.user_id === profile.id);
                        const isCreator = lobby.created_by === profile.id;
                        // Spielname für Anzeige
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
        window.loadLobbies = loadLobbies;

        // Initiales Laden
        loadLobbies();
        // Automatisches Reload alle 5 Sekunden
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
                        // Modal schließen, falls offen
                        const modal = document.querySelector('.lobby-detail-modal');
                        if (modal) modal.remove();
                        window.joinLobbyRoom(data.lobbyId); // Socket-Raum beitreten
                        setTimeout(() => {
                            window.location.href = '/games.html?lobbyId=' + encodeURIComponent(data.lobbyId);
                        }, 50);
                    } else if (res.ok) {
                        await loadLobbies();
                        // Modal schließen, falls offen
                        const modal = document.querySelector('.lobby-detail-modal');
                        if (modal) modal.remove();
                        // Fallback: Versuche, die Lobby zu finden und leite weiter
                        setTimeout(() => {
                            const lobby = (window.lastLobbies || []).find(l => l.players.some(p => p.user_id === profile.id));
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
                // Lobby-Detail-Modal anzeigen
                const id = openBtn.dataset.id;
                const lobby = (window.lastLobbies || []).find(l => l.id === id);
                if (!lobby) { showToast('Lobby nicht gefunden', 'error'); return; }
                // Einfaches Modal anzeigen (kann erweitert werden)
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

        // Socket.IO initialisieren, wenn verfügbar
        if (window.io) {
            const socket = window.io();
            // Eigene User-ID auslesen
            let profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
            // Nach Lobby-Join automatisch dem Lobby-Raum beitreten
            window.joinLobbyRoom = function (lobbyId) {
                if (socket && lobbyId) socket.emit('joinLobby', lobbyId);
            };
            // Listener für Lobby-Updates
            socket.on('lobbyUpdated', async () => {
                await loadLobbies();
                // Wenn ein Lobby-Detail-Popup offen ist, neu rendern
                const openLobbyModal = document.querySelector('.lobby-detail-modal');
                if (openLobbyModal && window.lastLobbies) {
                    const lobbyId = openLobbyModal.getAttribute('data-lobby-id');
                    const lobby = window.lastLobbies.find(l => l.id === lobbyId);
                    if (lobby) {
                        openLobbyModal.innerHTML = `
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
                        openLobbyModal.querySelector('#close-lobby-detail').onclick = () => openLobbyModal.remove();
                    }
                }
            });
            // Listener für Countdown vor Spielstart
            socket.on('lobbyCountdown', (data) => {
                // Countdown-Overlay erzeugen (immer nur einmal)
                let overlay = document.getElementById('countdown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'countdown-overlay';
                    overlay.className = 'fixed inset-0 flex items-center justify-center z-[9999] bg-black/70';
                    overlay.innerHTML = `<div id="countdown-timer" class="text-7xl font-bold text-white drop-shadow-lg bg-cyan-700/80 rounded-2xl px-12 py-8 border-4 border-cyan-300 animate-pulse"></div>`;
                    document.body.appendChild(overlay);
                }
                const timer = overlay.querySelector('#countdown-timer');
                let until = new Date(data.until).getTime();
                function updateCountdown() {
                    const now = Date.now();
                    let seconds = Math.max(0, Math.ceil((until - now) / 1000));
                    if (timer) timer.textContent = seconds > 0 ? seconds.toString() : 'Start!';
                    if (seconds > 0) {
                        setTimeout(updateCountdown, 100);
                    }
                }
                updateCountdown();
                // Overlay wird erst bei Spielstart entfernt!
            });
            // Listener für Spielstart
            socket.on('gameStarted', (game) => {
                // Countdown-Overlay entfernen, falls noch sichtbar
                const overlay = document.getElementById('countdown-overlay');
                if (overlay) overlay.remove();
                if (game && game.id) {
                    window.location.href = "/games.html?gameId=" + game.id;
                }
            });
            // Listener für Ready-Status-Update (optional, falls Backend Event sendet)
            socket.on('lobbyReadyUpdate', (data) => {
                // Optional: Sofort neu laden, falls Backend Event sendet
                if (data && data.gameId) pollAndRenderGame(data.gameId);
            });
        }
    });

    function renderBrain9Game(game) {
        let status = $("game-status");
        let grid = $("simon-grid");
        let players = $("game-players");
        let readyStatus = $("game-ready-status");
        if (!status || !grid || !players || !readyStatus) {
            // Versuche, das Spiel-UI dynamisch zu erzeugen, falls es fehlt
            const mainContent = document.getElementById('main-content');
            if (mainContent && !window._brain9_ui_injected) {
                window._brain9_ui_injected = true;
                mainContent.innerHTML = `
                    <h2 class="text-xl font-bold mb-4 text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                        <svg xmlns='http://www.w3.org/2000/svg' class='w-6 h-6 text-cyan-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' />
                        </svg>
                        Spielrunde
                    </h2>
                    <div id="game-status" class="mb-4 text-center text-base font-medium text-gray-700 dark:text-gray-200"></div>
                    <div id="simon-grid" class="grid grid-cols-3 gap-3 mb-4" aria-label="Simon Says Spielfeld" role="grid"></div>
                    <div id="game-players" class="flex flex-wrap gap-2 justify-center mb-2"></div>
                    <div id="game-actions" class="flex gap-2 justify-center"></div>
                    <div id="game-ready-status" class="flex flex-col items-center mt-2"></div>
                `;
                // Nach dem Einfügen: DOM-Elemente neu holen und erst dann erneut rendern
                requestAnimationFrame(() => {
                    status = $("game-status");
                    grid = $("simon-grid");
                    players = $("game-players");
                    readyStatus = $("game-ready-status");
                    if (status && grid && players && readyStatus) {
                        renderBrain9Game(game);
                    } else {
                        window.showToast && window.showToast('Fehler: Spiel-UI konnte nicht erzeugt werden!', 'error');
                        if (!status) console.error('game-status Element fehlt!');
                        if (!grid) console.error('simon-grid Element fehlt!');
                        if (!players) console.error('game-players Element fehlt!');
                        if (!readyStatus) console.error('game-ready-status Element fehlt!');
                    }
                });
            } else if (!mainContent) {
                window.showToast && window.showToast('Fehler: Hauptbereich (main-content) nicht gefunden!', 'error');
                console.error('Game-UI konnte nicht erzeugt werden: main-content fehlt im DOM.');
            }
            return;
        }
        if (readyStatus) {
            readyStatus.innerHTML = '';
        } else {
            console.error('readyStatus-Element nicht gefunden, kann Ready-Button nicht anzeigen.');
        }
        // Status
        if (game.finished) {
            const winner = game.players.find(p => p.id === game.winner);
            status.innerHTML = winner ? `<span class="text-green-600 font-bold">${winner.name} gewinnt Brain9!</span>` : 'Spiel beendet.';
            grid.innerHTML = '';
            return;
        }
        // ...restlicher Code der Funktion...
    }
    // ...existing code...
});
// Ensured proper closure of all nested blocks and functions.
