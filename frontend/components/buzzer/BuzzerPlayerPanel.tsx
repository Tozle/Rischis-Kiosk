import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BuzzerScoreboard } from './BuzzerScoreboard';
import { Toast } from './Toast';

// TODO: round_id und user_id als Props/context
export function BuzzerPlayerPanel({ round_id, user_id }: { round_id: string | null, user_id: string }) {
    const [joined, setJoined] = useState(false);
    const [lock, setLock] = useState(false);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type?: 'info' | 'error' | 'success' } | null>(null);

    // Check if joined
    useEffect(() => {
        if (!round_id || !user_id) return;
        let ignore = false;
        async function checkJoined() {
            const { data } = await supabase
                .from('buzzer_participants')
                .select('id')
                .eq('round_id', round_id)
                .eq('user_id', user_id)
                .single();
            if (!ignore) setJoined(!!data);
        }
        checkJoined();
        // Supabase v2 Realtime-API: channel
        const channel = supabase.channel(`buzzer-participants-${round_id}-${user_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'buzzer_participants',
                    filter: `round_id=eq.${round_id}`,
                },
                checkJoined
            )
            .subscribe();
        return () => { ignore = true; supabase.removeChannel(channel); };
    }, [round_id, user_id]);

    // Check if locked
    useEffect(() => {
        if (!round_id || !user_id) return;
        let ignore = false;
        async function checkLock() {
            const { data } = await supabase
                .from('buzzer_locks')
                .select('user_id')
                .eq('round_id', round_id)
                .single();
            if (!ignore) setLock(data?.user_id === user_id);
        }
        checkLock();
        // Supabase v2 Realtime-API: channel
        const channel = supabase.channel(`buzzer-locks-${round_id}-${user_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'buzzer_locks',
                    filter: `round_id=eq.${round_id}`,
                },
                checkLock
            )
            .subscribe();
        return () => { ignore = true; supabase.removeChannel(channel); };
    }, [round_id, user_id]);

    async function join() {
        if (!round_id || !user_id) return;
        setLoading(true);
        const { error } = await supabase.rpc('join_round', { round_id, user_id });
        setLoading(false);
        if (error) setToast({ message: error.message, type: 'error' });
        else setToast({ message: 'Beigetreten!', type: 'success' });
    }

    async function buzz() {
        if (!round_id || !user_id) return;
        setLoading(true);
        const { error } = await supabase.rpc('press_buzzer', { round_id, user_id });
        setLoading(false);
        if (error) setToast({ message: error.message, type: 'error' });
        else setToast({ message: 'Gebuzzert!', type: 'success' });
    }

    async function submitAnswer() {
        if (!round_id || !user_id || !lock) return;
        setLoading(true);
        const { error } = await supabase.rpc('submit_answer', { round_id, user_id, answer_text: answer });
        setLoading(false);
        setAnswer('');
        if (error) setToast({ message: error.message, type: 'error' });
        else setToast({ message: 'Antwort gesendet!', type: 'success' });
    }

    return (
        <div>
            <h2 className="font-semibold mb-2">Spieler-Panel</h2>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {!joined ? (
                <button onClick={join} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Mitspielen</button>
            ) : (
                <>
                    <button onClick={buzz} disabled={loading || lock} className="bg-yellow-500 text-white px-6 py-4 rounded-full text-xl mb-4">BUZZER</button>
                    {lock && (
                        <div className="mb-4 p-2 border rounded bg-green-50">
                            <div className="mb-2 font-semibold text-green-700">Du bist dran!</div>
                        </div>
                    )}
                </>
            )}
            <BuzzerScoreboard round_id={round_id} />
        </div>
    );
}
