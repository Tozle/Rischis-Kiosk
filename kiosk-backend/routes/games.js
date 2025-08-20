// Offene Lobbys abrufen
router.get('/lobby', async (req, res) => {
    // Hole alle nicht gestarteten und nicht beendeten Lobbys
    const { data, error } = await supabase
        .from('game_lobbies')
        .select('id, game_type, created_by, created_at, bet, lobby_size, started, finished, players:game_lobby_players(user_id, eliminated)')
        .eq('started', false)
        .eq('finished', false)
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ lobbies: data });
});

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

// Brain9 Highscore/Statistik
router.get('/brain9/stats', async (req, res) => {
    // Top 10 Spieler nach Siegen
    const { data: wins, error: winErr } = await supabase.rpc('brain9_top_winners');
    // Top 10 nach Teilnahmen
    const { data: plays, error: playErr } = await supabase
        .from('brain9_games')
        .select('*, players:brain9_moves!inner(user_id)')
        .order('created_at', { ascending: false });
    // Gewinnsumme pro User
    const { data: payouts, error: payoutErr } = await supabase.rpc('brain9_total_payouts');
    if (winErr || playErr || payoutErr) {
        return res.status(500).json({ error: winErr?.message || playErr?.message || payoutErr?.message });
    }
    res.json({ wins, plays, payouts });
});

// Lobby erstellen
router.post('/lobby', requireAuth, async (req, res) => {
    const { lobbySize, bet, game } = req.body;
    const user = req.user;
    if (!lobbySize || !bet || lobbySize < 2 || bet < 0) return res.status(400).json({ error: 'Ungültige Lobbydaten' });
    // Persistente Lobby in Supabase anlegen
    const { data, error } = await supabase.from('game_lobbies').insert({
        game_type: game || 'brain9',
        lobby_size: lobbySize,
        bet,
        created_by: user.id
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    // Spieler direkt als ersten Teilnehmer eintragen
    await supabase.from('game_lobby_players').insert({
        lobby_id: data.id,
        user_id: user.id
    });
    res.json({ lobbyId: data.id });
});

// Lobby beitreten
router.post('/lobby/:id/join', requireAuth, async (req, res) => {
    const lobby = lobbies[req.params.id];
    const user = req.user;
    if (!lobby) return res.status(404).json({ error: 'Lobby nicht gefunden' });
    if (lobby.players.find(p => p.id === user.id)) return res.status(400).json({ error: 'Schon beigetreten' });
    if (lobby.players.length >= lobby.lobbySize) return res.status(400).json({ error: 'Lobby voll' });
    lobby.players.push({ id: user.id, name: user.name, balance: user.balance, profile_image_url: user.profile_image_url });
    // Wenn Lobby voll, Spiel automatisch starten
    if (lobby.players.length === lobby.lobbySize) {
        await supabase.from('game_lobbies').update({ started: true }).eq('id', lobby.id);
        // Spiel initialisieren
        const { data: game, error: gameError } = await supabase
            .from('brain9_games')
            .insert({ lobby_id: lobby.id })
            .select()
            .single();
        if (gameError) return res.status(500).json({ error: gameError.message });
        return res.json({ success: true, gameId: game.id });
    }
    res.json({ success: true });
});

// Spiel starten
// Manuelles Starten nicht mehr nötig (wird automatisch gemacht)

// Spielstatus abfragen
// Spielstatus abfragen (aus DB)
router.get('/game/:id', requireAuth, async (req, res) => {
    const gameId = req.params.id;
    // Spiel holen
    const { data: game, error } = await supabase
        .from('brain9_games')
        .select('*, lobby:game_lobbies(*, players:game_lobby_players(user_id, eliminated))')
        .eq('id', gameId)
        .single();
    if (error || !game) return res.status(404).json({ error: 'Spiel nicht gefunden' });
    // Moves holen
    const { data: moves } = await supabase
        .from('brain9_moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_index', { ascending: true });
    res.json({ ...game, moves });
});

// Spielzug machen
router.post('/game/:id/move', requireAuth, async (req, res) => {
    const gameId = req.params.id;
    const user = req.user;
    const { buttonIndex } = req.body;
    // Spiel und Moves holen
    const { data: game, error: gameError } = await supabase
        .from('brain9_games')
        .select('*, lobby:game_lobbies(*, players:game_lobby_players(user_id, eliminated))')
        .eq('id', gameId)
        .single();
    if (gameError || !game) return res.status(400).json({ error: 'Spiel nicht gefunden oder beendet' });
    const { data: moves } = await supabase
        .from('brain9_moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_index', { ascending: true });
    // Aktive Spieler bestimmen
    let eliminated = {};
    moves.forEach(m => { if (!m.correct) eliminated[m.user_id] = true; });
    const allPlayers = game.lobby.players.map(p => p.user_id);
    const activePlayers = allPlayers.filter(id => !eliminated[id]);
    // Wer ist am Zug?
    const turn = moves.length;
    const currentPlayerId = activePlayers[turn % activePlayers.length];
    if (user.id !== currentPlayerId) return res.status(403).json({ error: 'Nicht dein Zug' });
    // Sequence bestimmen
    const sequence = moves.filter(m => m.correct).map(m => m.button_index);
    const expected = sequence[turn];
    let correct = true;
    if (expected !== undefined && buttonIndex !== expected) correct = false;
    // Move speichern
    await supabase.from('brain9_moves').insert({
        game_id: gameId,
        user_id: user.id,
        move_index: turn,
        button_index,
        correct
    });
    // Prüfen ob jemand eliminiert wurde
    let winner = null;
    let finished = false;
    if (!correct) {
        if (activePlayers.length - 1 === 1) {
            finished = true;
            winner = activePlayers.find(id => id !== user.id);
            await supabase.from('brain9_games').update({ finished_at: new Date().toISOString(), winner_id: winner }).eq('id', gameId);
            // Auszahlung an Gewinner
            const einsatz = game.lobby.bet;
            const payout = einsatz * allPlayers.length;
            await supabase.from('users').update({ balance: supabase.rpc('add_balance', { user_id: winner, amount: payout }) }).eq('id', winner);
        }
    } else if (activePlayers.length === 1) {
        finished = true;
        winner = activePlayers[0];
        await supabase.from('brain9_games').update({ finished_at: new Date().toISOString(), winner_id: winner }).eq('id', gameId);
        // Auszahlung an Gewinner
        const einsatz = game.lobby.bet;
        const payout = einsatz * allPlayers.length;
        await supabase.from('users').update({ balance: supabase.rpc('add_balance', { user_id: winner, amount: payout }) }).eq('id', winner);
    }
    res.json({ success: true, next: activePlayers[(turn + 1) % activePlayers.length], sequence: correct ? [...sequence, buttonIndex] : sequence, winner });
});

export default router;
