import express from 'express';
import { randomUUID } from 'node:crypto';
import supabase from '../utils/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBuzzerRound } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../utils/env.js';

const router = express.Router();
const BANK_USER_NAME = env.BANK_USER_NAME;

// -----------------------
// Simple Server-Sent Events setup
// -----------------------
let sseClients = [];

function broadcastBuzz() {
  const msg = `event: buzz\ndata: buzz\n\n`;
  sseClients.forEach((client) => client.write(msg));
}

function broadcastUnlock() {
  const msg = `event: unlock\ndata: unlock\n\n`;
  sseClients.forEach((client) => client.write(msg));
}

function broadcastLock() {
  const msg = `event: lock\ndata: lock\n\n`;
  sseClients.forEach((client) => client.write(msg));
}

router.get('/events', requireAuth, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  });
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

router.get(
  '/round',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round, error } = await supabase
      .from('buzzer_rounds')
      .select('*')
      .eq('active', true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    if (!round) {
      return res.status(404).json({ round: null });
    }

    res.json({ round });
  }),
);

router.get(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('username, online, users(role)');
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    res.json({ sessions: data });
  }),
);

router.get(
  '/participants',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();
    if (!round) return res.status(404).json({ participants: [] });
    const { data, error } = await supabase
      .from('buzzer_participants')
      .select('user_id, users(name)')
      .eq('round_id', round.id);
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    res.json({ participants: data });
  }),
);

router.get(
  '/leaderboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();
    if (!round) return res.status(404).json({ leaderboard: [] });
    const { data, error } = await supabase
      .from('buzzer_participants')
      .select('user_id, score, users(name)')
      .eq('round_id', round.id)
      .order('score', { ascending: false });
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    res.json({ leaderboard: data });
  }),
);

router.post(
  '/round',
  requireAdmin,
  validateBuzzerRound,
  asyncHandler(async (req, res) => {
    const { bet, points_limit } = req.body;
    const { data: existing, error: existingError } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('createRound existingError', existingError);
      return res.status(500).json({
        error: 'Runde konnte nicht erstellt werden',
        detail: existingError.message,
      });
    }

    if (existing)
      return res.status(400).json({ error: 'Es läuft bereits eine Runde' });

    const { data, error } = await supabase
      .from('buzzer_rounds')
      .insert({
        id: randomUUID(),
        bet,
        points_limit,
        active: true,
        joinable: true,
      })
      .select()
      .single();
    if (error) {
      console.error('createRound insert error', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Es läuft bereits eine Runde' });
      }
      return res.status(500).json({
        error: 'Runde konnte nicht erstellt werden',
        detail: error.message,
      });
    }
    res.json({ round: data });
  }),
);

router.post(
  '/round/end',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id, bet')
      .eq('active', true)
      .single();

    if (!round) return res.status(404).json({ error: 'Keine aktive Runde' });

    const { data: participants } = await supabase
      .from('buzzer_participants')
      .select('user_id, score')
      .eq('round_id', round.id)
      .order('score', { ascending: false });

    const pot = round.bet * (participants?.length || 0);
    const winner = participants?.[0];

    const { error } = await supabase
      .from('buzzer_rounds')
      .update({ active: false, joinable: false, winner_id: winner?.user_id })
      .eq('id', round.id);

    if (error)
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht beendet werden' });

    if (winner && pot > 0) {
      const winnerShare = pot * 0.95;
      const bankShare = pot - winnerShare;

      const { data: winUser } = await supabase
        .from('users')
        .select('balance')
        .eq('id', winner.user_id)
        .single();
      await supabase
        .from('users')
        .update({ balance: (winUser?.balance || 0) + winnerShare })
        .eq('id', winner.user_id);

      if (BANK_USER_NAME) {
        const { data: bank } = await supabase
          .from('users')
          .select('id, balance')
          .eq('name', BANK_USER_NAME)
          .maybeSingle();
        if (bank)
          await supabase
            .from('users')
            .update({ balance: (bank.balance || 0) + bankShare })
            .eq('id', bank.id);
      }
    }

    // Mark all KOLOs as inactive
    await supabase
      .from('kolos')
      .update({ active: false });

    res.json({ ended: true });
  }),
);

router.post(
  '/round/lock',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id, joinable')
      .eq('active', true)
      .single();

    if (!round) return res.status(404).json({ error: 'Keine aktive Runde' });

    if (round.joinable === false)
      return res.status(400).json({ error: 'Runde bereits geschlossen' });

    const { error } = await supabase
      .from('buzzer_rounds')
      .update({ joinable: false })
      .eq('id', round.id);

    if (error)
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht geschlossen werden' });

    res.json({ locked: true });
  }),
);

router.get(
  '/kolo',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();

    if (!round) return res.status(404).json({ kolo: null });

    const { data: kolo } = await supabase
      .from('kolos')
      .select('id, active, created_at')
      .eq('round_id', round.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count } = await supabase
      .from('kolos')
      .select('id', { count: 'exact', head: true })
      .eq('round_id', round.id);

    res.json({ kolo, number: count });
  }),
);

router.post(
  '/kolo',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();

    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });

    // Deactivate previous KOLO if it is still marked as active
    const { data: lastKolo } = await supabase
      .from('kolos')
      .select('id, active')
      .eq('round_id', round.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastKolo?.active) {
      await supabase
        .from('kolos')
        .update({ active: false })
        .eq('id', lastKolo.id);
    }

    const { data, error } = await supabase
      .from('kolos')
      .insert({ id: randomUUID(), round_id: round.id, active: true })
      .select()
      .single();

    if (error)
      return res
        .status(500)
        .json({ error: 'KOLO konnte nicht gestartet werden' });

    await supabase
      .from('buzzer_participants')
      .update({ has_buzzed: false, has_skipped: false })
      .eq('round_id', round.id);

    res.json({ kolo: data });
    broadcastUnlock();
  }),
);

router.post(
  '/kolo/end',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { correct } = req.body ?? {};

    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();

    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });

    const { data: kolo } = await supabase
      .from('kolos')
      .select('id')
      .eq('round_id', round.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!kolo) return res.status(400).json({ error: 'Kein aktives KOLO' });

    const { error: endError } = await supabase
      .from('kolos')
      .update({ active: false })
      .eq('id', kolo.id);

    if (endError)
      return res
        .status(500)
        .json({ error: 'KOLO konnte nicht beendet werden' });

    if (correct) {
      const { data: firstBuzz } = await supabase
        .from('buzzes')
        .select('user_id')
        .eq('kolo_id', kolo.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstBuzz) {
        const { data: participant } = await supabase
          .from('buzzer_participants')
          .select('score')
          .eq('round_id', round.id)
          .eq('user_id', firstBuzz.user_id)
          .single();
        const newScore = (participant?.score || 0) + 1;
        await supabase
          .from('buzzer_participants')
          .update({ score: newScore })
          .eq('round_id', round.id)
          .eq('user_id', firstBuzz.user_id);
      }
    }

    res.json({ ended: true });
  }),
);

router.post(
  '/join',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id, joinable, bet')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    if (round.joinable === false)
      return res.status(400).json({ error: 'Runde ist geschlossen' });

    const { count } = await supabase
      .from('buzzer_participants')
      .select('id', { count: 'exact', head: true })
      .eq('round_id', round.id)
      .eq('user_id', userId);
    if (count > 0)
      return res.status(400).json({ error: 'Bereits beigetreten' });

    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();
    const newBalance = (user?.balance || 0) - round.bet;
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    const { error } = await supabase.from('buzzer_participants').insert({
      id: randomUUID(),
      round_id: round.id,
      user_id: userId,
      score: 0,
      has_buzzed: false,
      has_skipped: false,
    });
    if (error)
      return res.status(500).json({ error: 'Teilnahme fehlgeschlagen' });
    res.json({ joined: true });
  }),
);

router.post(
  '/buzz',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    const { data: kolo } = await supabase
      .from('kolos')
      .select('id')
      .eq('round_id', round.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!kolo) return res.status(400).json({ error: 'Kein aktives KOLO' });
    const { data: participant } = await supabase
      .from('buzzer_participants')
      .select('has_buzzed, has_skipped')
      .eq('round_id', round.id)
      .eq('user_id', userId)
      .single();
    if (!participant)
      return res.status(400).json({ error: 'Nicht Teilnehmer' });
    if (participant.has_buzzed || participant.has_skipped)
      return res.status(400).json({ error: 'Bereits Buzz/Skip genutzt' });

    const { count: existingBuzzes } = await supabase
      .from('buzzes')
      .select('id', { count: 'exact', head: true })
      .eq('kolo_id', kolo.id);
    if (existingBuzzes > 0)
      return res.status(400).json({ error: 'Buzzer bereits ausgelöst' });

    const { error } = await supabase
      .from('buzzes')
      .insert({ id: randomUUID(), kolo_id: kolo.id, user_id: userId });
    if (error) return res.status(500).json({ error: 'Buzz fehlgeschlagen' });

    await supabase
      .from('buzzer_participants')
      .update({ has_buzzed: true })
      .eq('round_id', round.id)
      .eq('user_id', userId);

    const { data: firstBuzz } = await supabase
      .from('buzzes')
      .select('user_id')
      .eq('kolo_id', kolo.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    res.json({ buzzed: true });
    broadcastBuzz();
    if (firstBuzz?.user_id === userId) broadcastLock();
  }),
);

router.post(
  '/skip',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    const { data: kolo } = await supabase
      .from('kolos')
      .select('id')
      .eq('round_id', round.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!kolo) return res.status(400).json({ error: 'Kein aktives KOLO' });
    const { data: participant } = await supabase
      .from('buzzer_participants')
      .select('has_buzzed, has_skipped')
      .eq('round_id', round.id)
      .eq('user_id', userId)
      .single();
    if (!participant)
      return res.status(400).json({ error: 'Nicht Teilnehmer' });
    if (participant.has_buzzed || participant.has_skipped)
      return res.status(400).json({ error: 'Bereits Buzz/Skip genutzt' });

    const { error } = await supabase
      .from('skips')
      .insert({ id: randomUUID(), kolo_id: kolo.id, user_id: userId });
    if (error) return res.status(500).json({ error: 'Skip fehlgeschlagen' });

    await supabase
      .from('buzzer_participants')
      .update({ has_skipped: true })
      .eq('round_id', round.id)
      .eq('user_id', userId);

    res.json({ skipped: true });
  }),
);

export default router;
