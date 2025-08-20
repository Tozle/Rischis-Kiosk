// Lobbys auflisten (für Frontend)
router.get('/lobby', (req, res) => {
  // Nur offene Lobbys zurückgeben
  const openLobbies = Object.values(lobbies).filter(lobby => !lobby.started);
  res.json({ lobbies: openLobbies });
});
// games.js – Multiplayer Lobby & Game API
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// In-memory store (for MVP, replace with DB for production)
const lobbies = {};
const games = {};

// Lobby erstellen
router.post('/lobby', requireAuth, (req, res) => {
  const { lobbySize, bet } = req.body;
  const user = req.user;
  if (!lobbySize || !bet || lobbySize < 2 || bet < 0) return res.status(400).json({ error: 'Ungültige Lobbydaten' });
  const lobbyId = uuidv4();
  lobbies[lobbyId] = {
    id: lobbyId,
    players: [{ id: user.id, name: user.name, balance: user.balance, profile_image_url: user.profile_image_url }],
    lobbySize,
    bet,
    started: false,
    createdAt: Date.now(),
  };
  res.json({ lobbyId });
});

// Lobby beitreten
router.post('/lobby/:id/join', requireAuth, (req, res) => {
  const lobby = lobbies[req.params.id];
  const user = req.user;
  if (!lobby) return res.status(404).json({ error: 'Lobby nicht gefunden' });
  if (lobby.players.find(p => p.id === user.id)) return res.status(400).json({ error: 'Schon beigetreten' });
  if (lobby.players.length >= lobby.lobbySize) return res.status(400).json({ error: 'Lobby voll' });
  lobby.players.push({ id: user.id, name: user.name, balance: user.balance, profile_image_url: user.profile_image_url });
  // Wenn Lobby voll, Spiel automatisch starten
  if (lobby.players.length === lobby.lobbySize) {
    // Einsatz abziehen (hier nur im Speicher, TODO: DB!)
    lobby.players.forEach(p => { p.balance -= lobby.bet; });
    const gameId = lobby.id;
    games[gameId] = {
      id: gameId,
      players: [...lobby.players],
      sequence: [],
      turn: 0,
      activePlayers: lobby.players.map(p => p.id),
      timeouts: {},
      startedAt: Date.now(),
      finished: false,
      winner: null,
    };
    lobby.started = true;
    return res.json({ success: true, gameId });
  }
  res.json({ success: true });
});

// Spiel starten
// Manuelles Starten nicht mehr nötig (wird automatisch gemacht)

// Spielstatus abfragen
router.get('/game/:id', requireAuth, (req, res) => {
  const game = games[req.params.id];
  if (!game) return res.status(404).json({ error: 'Spiel nicht gefunden' });
  res.json(game);
});

// Spielzug machen
router.post('/game/:id/move', requireAuth, (req, res) => {
  const game = games[req.params.id];
  const user = req.user;
  const { buttonIndex } = req.body;
  if (!game || game.finished) return res.status(400).json({ error: 'Spiel nicht gefunden oder beendet' });
  const currentPlayerId = game.activePlayers[game.turn % game.activePlayers.length];
  if (user.id !== currentPlayerId) return res.status(403).json({ error: 'Nicht dein Zug' });
  // Prüfe Zug
  const expected = game.sequence[game.turn];
  if (expected !== undefined && buttonIndex !== expected) {
    // Fehler: Spieler raus
    game.activePlayers = game.activePlayers.filter(id => id !== user.id);
    if (game.activePlayers.length === 1) {
      game.finished = true;
      game.winner = game.activePlayers[0];
      // TODO: Einsatz auszahlen
    }
    return res.json({ error: 'Falscher Button', eliminated: true, winner: game.winner });
  }
  // Richtiger Zug, ggf. neuen Button ergänzen
  if (game.turn === game.sequence.length) {
    game.sequence.push(buttonIndex);
  }
  game.turn++;
  // Nächster Spieler
  if (game.activePlayers.length === 1) {
    game.finished = true;
    game.winner = game.activePlayers[0];
    // TODO: Einsatz auszahlen
  }
  res.json({ success: true, next: game.activePlayers[game.turn % game.activePlayers.length], sequence: game.sequence, winner: game.winner });
});

export default router;
