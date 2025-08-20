import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../utils/supabase.js';
import { getIO } from '../utils/socket.js'; // Use getIO to access io instance

const router = express.Router();

// Offene Lobbys abrufen
router.get('/lobby', async (req, res) => {
    // Hole alle nicht gestarteten und nicht beendeten Lobbys inkl. Spieler-Profilen
    const { data, error } = await supabase
        .from('game_lobbies')
        .select(`
            id, game_type, created_by, created_at, bet, lobby_size, started, finished,
            players:game_lobby_players(
                user_id,
                eliminated,
                user:users(id, name, profile_image_url)
            )
        `)
        .eq('started', false)
        .eq('finished', false)
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    // Spieler-Infos für Frontend aufbereiten und Alter der Lobby berechnen
    const lobbies = (data || []).map(lobby => {
        const ageInMinutes = Math.floor((Date.now() - new Date(lobby.created_at).getTime()) / 60000);
        return {
            ...lobby,
            age: `${ageInMinutes} Minuten`,
            players: (lobby.players || []).map(p => ({
                user_id: p.user_id,
                eliminated: p.eliminated,
                name: p.user?.name || '',
                profile_image_url: p.user?.profile_image_url || ''
            }))
        };
    });

    res.json({ lobbies });
});

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

    if (!lobbySize || !bet || lobbySize < 2 || bet < 0) {
        return res.status(400).json({ error: 'Ungültige Lobby-Parameter.' });
    }

    // Persistente Lobby in Supabase anlegen
    const { data, error } = await supabase.from('game_lobbies').insert({
        game_type: game || 'brain9',
        lobby_size: lobbySize,
        bet,
        created_by: user.id,
        last_activity: new Date().toISOString()
    }).select().single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Spieler direkt als ersten Teilnehmer eintragen
    await supabase.from('game_lobby_players').insert({
        lobby_id: data.id,
        user_id: user.id
    });

    res.json({ lobbyId: data.id });
});

// Lobby beitreten
router.post('/lobby/:id/join', requireAuth, async (req, res) => {
    const lobbyId = req.params.id;
    const user = req.user;

    // Hole die Lobby inkl. Spieler
    const { data: lobby, error } = await supabase
        .from('game_lobbies')
        .select('*, players:game_lobby_players(user_id)')
        .eq('id', lobbyId)
        .single();

    if (error || !lobby) {
        console.error('Lobby fetch error:', error);
        return res.status(404).json({ error: 'Lobby nicht gefunden' });
    }

    console.log('Lobby data:', lobby);

    // Überprüfen, ob die Lobby voll ist
    if ((lobby.players || []).length >= lobby.lobby_size) {
        console.warn('Lobby is full:', { players: lobby.players, lobbySize: lobby.lobby_size });
        return res.status(400).json({ error: 'Lobby ist bereits voll' });
    }

    // Spieler zur Lobby hinzufügen
    const { error: insertError } = await supabase
        .from('game_lobby_players')
        .insert({
            lobby_id: lobbyId,
            user_id: user.id
        });

    if (insertError) {
        console.error('Player insert error:', insertError);
        return res.status(500).json({ error: 'Fehler beim Beitreten der Lobby' });
    }

    // last_activity aktualisieren
    await supabase
        .from('game_lobbies')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', lobbyId);

    console.log('Player added to lobby:', { lobbyId, userId: user.id });

    // WebSocket-Update senden
    let io;
    try {
        io = getIO();
    } catch (e) {
        io = null;
    }
    if (io) {
        // Debug: Zeige alle Sockets im Raum vor dem Emit
        if (io.sockets && io.sockets.adapter && io.sockets.adapter.rooms) {
            const room = io.sockets.adapter.rooms.get(lobbyId);
            console.log(`[lobbyUpdated] Sockets im Raum ${lobbyId}:`, room ? Array.from(room) : []);
        }
        console.log(`[lobbyUpdated] Sende Event an Raum ${lobbyId}`);
        io.to(lobbyId).emit('lobbyUpdated');
    } else {
        console.warn('WebSocket server (io) is not defined. Skipping lobbyUpdated event.');
    }

    // Spiel starten, wenn die Lobby voll ist
    const updatedLobby = await supabase
        .from('game_lobby_players')
        .select('*')
        .eq('lobby_id', lobbyId);

    if (updatedLobby.data.length === lobby.lobby_size) {
        const { data: game, error: gameError } = await supabase
            .from('brain9_games')
            .insert({
                lobby_id: lobbyId,
                game_type: lobby.game_type
            })
            .select()
            .single();

        if (gameError) {
            console.error('Game creation error:', gameError);
            return res.status(500).json({ error: 'Fehler beim Starten des Spiels' });
        }

        console.log('Game started:', game);
        if (io) {
            if (io.sockets && io.sockets.adapter && io.sockets.adapter.rooms) {
                const room = io.sockets.adapter.rooms.get(lobbyId);
                console.log(`[gameStarted] Sockets im Raum ${lobbyId}:`, room ? Array.from(room) : []);
            }
            console.log(`[gameStarted] Sende Event an Raum ${lobbyId} mit game:`, game);
            io.to(lobbyId).emit('gameStarted', game);
        } else {
            console.warn('WebSocket server (io) is not defined. Skipping gameStarted event.');
        }
    }

    res.json({ message: 'Lobby beigetreten', lobbyId });
});

// Spielstatus abfragen (aus DB) – KORREKTE POSITION
router.get('/game/:id', requireAuth, async (req, res) => {
    const gameId = req.params.id;
    // Spiel holen inkl. Lobby und Spieler
    const { data: game, error } = await supabase
        .from('brain9_games')
        .select('*, lobby:game_lobbies(*, players:game_lobby_players(user_id, eliminated, user:users(id, name, profile_image_url)))')
        .eq('id', gameId)
        .single();
    if (error || !game) return res.status(404).json({ error: 'Spiel nicht gefunden' });
    // Moves holen
    const { data: moves } = await supabase
        .from('brain9_moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_index', { ascending: true });

    // Spieler-Objekte extrahieren
    const allPlayers = (game.lobby?.players || []).map(p => ({
        id: p.user_id,
        name: p.user?.name || '',
        profile_image_url: p.user?.profile_image_url || ''
    }));
    // Eliminierte Spieler bestimmen
    let eliminated = {};
    (moves || []).forEach(m => { if (!m.correct) eliminated[m.user_id] = true; });
    const activePlayers = allPlayers.filter(p => !eliminated[p.id]).map(p => p.id);
    // Wer ist am Zug?
    const turn = (moves || []).length;
    // Sequence bestimmen
    const sequence = (moves || []).filter(m => m.correct).map(m => m.button_index);
    // Winner bestimmen
    const winner = game.winner_id || null;

    res.json({
        id: game.id,
        players: allPlayers,
        activePlayers,
        turn,
        sequence,
        finished: game.finished,
        winner
    });
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
        button_index: buttonIndex,
        correct
    });
    // last_activity aktualisieren
    await supabase
        .from('game_lobbies')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', game.lobby_id || game.lobby.id);

    // Gewinnerermittlung: Wenn alle anderen Spieler eliminiert sind, den aktuellen Spieler als Gewinner setzen
    if (correct) {
        const allEliminated = activePlayers.length === 1;
        let winnerId = null;
        if (allEliminated) {
            winnerId = activePlayers[0];
            await supabase
                .from('brain9_games')
                .update({ finished: true, winner_id: winnerId })
                .eq('id', gameId);
        }

        // Broadcast an alle Spieler im Raum
        let io;
        try {
            io = getIO();
        } catch (e) {
            io = null;
        }
        if (io) {
            const room = io.sockets.adapter.rooms.get(gameId);
            console.log(`[move] Sende Event an Raum ${gameId} mit winnerId:`, winnerId);
            io.to(gameId).emit('move', {
                gameId,
                winnerId,
                playerId: user.id,
                correct,
                allEliminated
            });
        } else {
            console.warn('WebSocket server (io) is not defined. Skipping move event.');
        }
    }

    res.json({ message: 'Zug erfolgreich', correct });
});

// Spiel starten
router.post('/lobby/:id/start', requireAuth, async (req, res) => {
    const lobbyId = req.params.id;

    // Hole die Lobby inkl. Spieler
    const { data: lobby, error } = await supabase
        .from('game_lobbies')
        .select('*, players:game_lobby_players(user_id)')
        .eq('id', lobbyId)
        .single();

    if (error || !lobby) {
        console.error('Lobby fetch error:', error);
        return res.status(404).json({ error: 'Lobby nicht gefunden' });
    }

    console.log('Lobby data:', lobby);

    // Überprüfen, ob die Lobby voll ist
    if ((lobby.players || []).length < lobby.lobby_size) {
        console.warn('Lobby is not full:', { players: lobby.players, lobbySize: lobby.lobby_size });
        return res.status(400).json({ error: 'Lobby ist noch nicht voll' });
    }

    // Spiel erstellen
    const { data: game, error: gameError } = await supabase
        .from('brain9_games')
        .insert({
            lobby_id: lobbyId,
            game_type: lobby.game_type
        })
        .select()
        .single();

    if (gameError) {
        console.error('Game creation error:', gameError);
        return res.status(500).json({ error: 'Fehler beim Starten des Spiels' });
    }

    console.log('Game created:', game);

    // Aktualisiere den Lobby-Status
    const { error: updateError } = await supabase
        .from('game_lobbies')
        .update({ started: true })
        .eq('id', lobbyId);

    if (updateError) {
        console.error('Lobby status update error:', updateError);
        return res.status(500).json({ error: 'Fehler beim Aktualisieren des Lobby-Status' });
    }

    console.log('Lobby status updated to started');

    res.json({ game });
});

// Inaktive Lobbys beenden
router.post('/lobbies/cleanup', async (req, res) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    console.log('Cleaning up lobbies. Time threshold:', tenMinutesAgo);

    // Aktualisiere alle Lobbys, die seit 10 Minuten keine Aktivität hatten und nicht gestartet oder beendet wurden
    const { data, error } = await supabase
        .from('game_lobbies')
        .update({ finished: true })
        .eq('started', false)
        .eq('finished', false)
        .lt('last_activity', tenMinutesAgo)
        .select();

    if (error) {
        console.error('Error cleaning up lobbies:', error);
        return res.status(500).json({ error: 'Fehler beim Bereinigen der Lobbys' });
    }

    console.log('Cleaned up lobbies:', data);
    res.json({ message: 'Inaktive Lobbys wurden beendet', cleanedLobbies: data });
});

export default router;
