import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BuzzerQueue } from './BuzzerQueue';
import { BuzzerScoreboard } from './BuzzerScoreboard';
import { BuzzerPotSummary } from './BuzzerPotSummary';

interface Round {
    id: string;
    title: string;
    status: string;
}

export function BuzzerAdminPanel({ onRoundChange }: { onRoundChange: (id: string | null) => void }) {
    const [rounds, setRounds] = useState<Round[]>([]);
    const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    // Adjudication State
    const [lockUser, setLockUser] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [adjudicating, setAdjudicating] = useState(false);

    // Fetch current lock for selected round
    useEffect(() => {
        if (!currentRoundId) { setLockUser(null); return; }
        let ignore = false;
        async function fetchLock() {
            const { data } = await supabase
                .from('buzzer_locks')
                .select('user_id')
                .eq('round_id', currentRoundId)
                .single();
            if (!ignore) setLockUser(data?.user_id ?? null);
        }
        fetchLock();
        // Supabase v2 Realtime-API: channel
        const channel = supabase.channel(`buzzer-locks-${currentRoundId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'buzzer_locks',
                    filter: `round_id=eq.${currentRoundId}`,
                },
                fetchLock
            )
            .subscribe();
        return () => {
            ignore = true;
            supabase.removeChannel(channel);
        };
    }, [currentRoundId]);

    // Fetch rounds
    useEffect(() => {
        let ignore = false;
        async function fetchRounds() {
            const { data } = await supabase
                .from('buzzer_rounds')
                .select('id, title, status')
                .order('created_at', { ascending: false });
            if (!ignore && data) setRounds(data);
        }
        fetchRounds();
        // Supabase v2 Realtime-API: channel
        const channel = supabase.channel('buzzer-rounds')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'buzzer_rounds',
                },
                fetchRounds
            )
            .subscribe();
        return () => {
            ignore = true;
            supabase.removeChannel(channel);
        };
    }, []);

    async function adjudicate(isCorrect: boolean) {
        if (!currentRoundId || !lockUser) return;
        setAdjudicating(true);
        const { error } = await supabase.rpc('adjudicate_current', {
            round_id: currentRoundId,
            is_correct: isCorrect,
            gm_user_id: 'GM-USER-ID',
        });
        setAdjudicating(false);
        if (error) alert(error.message);
        setAnswerText('');
    }

    async function createRound() {
        if (!newTitle) return;
        setLoading(true);
        const { error } = await supabase
            .from('buzzer_rounds')
            .insert([{ title: newTitle, status: 'draft' }]);
        setLoading(false);
        setNewTitle('');
        if (error) alert(error.message);
    }

    async function startRound() {
        if (!currentRoundId) return;
        setLoading(true);
        const { error } = await supabase.rpc('start_round', { round_id: currentRoundId });
        setLoading(false);
        if (error) alert(error.message);
    }

    async function endRound() {
        if (!currentRoundId) return;
        setLoading(true);
        const { error } = await supabase.rpc('end_round', { round_id: currentRoundId, gm_user_id: 'GM-USER-ID' });
        setLoading(false);
        if (error) alert(error.message);
    }

    // Callback an Dashboard, wenn Runde geändert wird
    function handleRoundChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newId = e.target.value || null;
        setCurrentRoundId(newId);
        onRoundChange(newId);
    }
    return (
        <div>
            <h2 className="font-semibold mb-2">Admin-Panel (Game Master)</h2>
            <div className="mb-4 flex gap-2 items-end">
                <div>
                    <label className="block text-sm">Neue Runde:</label>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="border p-1 mr-2" placeholder="Titel" />
                    <button onClick={createRound} disabled={loading || !newTitle} className="bg-blue-600 text-white px-2 py-1 rounded">Anlegen</button>
                </div>
                <div>
                    <label className="block text-sm">Runde wählen:</label>
                    <select value={currentRoundId ?? ''} onChange={handleRoundChange} className="border p-1">
                        <option value="">—</option>
                        {rounds.map(r => (
                            <option key={r.id} value={r.id}>{r.title} ({r.status})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <button onClick={startRound} disabled={!currentRoundId || loading} className="bg-green-600 text-white px-2 py-1 rounded mr-2">Starten</button>
                    <button onClick={endRound} disabled={!currentRoundId || loading} className="bg-red-600 text-white px-2 py-1 rounded">Beenden</button>
                </div>
            </div>
            {/* Live-Queue */}
            <BuzzerQueue round_id={currentRoundId} />
            {/* Aktueller Lock, Antwortfeld, Adjudicate-Buttons */}
            {lockUser && (
                <div className="mb-4 p-2 border rounded bg-yellow-50">
                    <div className="mb-2 font-semibold">Aktuell dran: <span className="text-blue-700">{lockUser}</span></div>
                    <button
                        className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                        onClick={() => adjudicate(true)}
                        disabled={adjudicating}
                    >✔ Punkt</button>
                    <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => adjudicate(false)}
                        disabled={adjudicating}
                    >✖ Kein Punkt</button>
                </div>
            )}
            {/* Scoreboard, Pot/House/Net */}
            <BuzzerScoreboard round_id={currentRoundId} />
            <BuzzerPotSummary round_id={currentRoundId} />
        </div>
    );
}
