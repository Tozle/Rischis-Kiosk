const socket = io();

// Lobby ID aus der URL extrahieren
const lobbyId = new URLSearchParams(window.location.search).get('lobbyId');
if (lobbyId) {
    socket.emit('joinLobby', lobbyId);
}

// Echtzeit-Update der Lobby
socket.on('lobbyUpdated', () => {
    console.log('Lobby wurde aktualisiert.');
    // Hier könnte ein API-Aufruf erfolgen, um die aktuellen Lobby-Daten abzurufen und die UI zu aktualisieren
    fetch(`/api/lobby/${lobbyId}`)
        .then(response => response.json())
        .then(data => {
            // Aktualisiere die UI mit den neuen Lobby-Daten
            updateLobbyUI(data);
        });
});

// Spielstart-Event
socket.on('gameStarted', (game) => {
    console.log('Spiel wurde gestartet:', game);
    // Weiterleitung zur Spielseite
    window.location.href = `/game/${game.id}`;
});

function updateLobbyUI(lobby) {
    // Beispiel: Spieler in der Lobby anzeigen
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
    lobby.players.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.textContent = player.name;
        playerList.appendChild(playerItem);
    });
}