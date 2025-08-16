import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface ScoreEntry {
    user_id: string;
    points: number;
}

export function BuzzerScoreboard({ round_id }: { round_id: string | null }) {
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    useEffect(() => {
        if (!round_id) return;
        let ignore = false;
        async function fetchScores() {
            const { data, error } = await supabase
                .from('buzzer_scores')
                .select('*')
                .eq('round_id', round_id)
                .order('points', { ascending: false });
            if (!ignore && data) setScores(data);
        }
        fetchScores();
        // Supabase v2 Realtime-API: channel
        const channel = supabase.channel(`buzzer-scores-${round_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'buzzer_scores',
                    filter: `round_id=eq.${round_id}`,
                },
                fetchScores
            )
            .subscribe();
        return () => {
            ignore = true;
            supabase.removeChannel(channel);
        };
    }, [round_id]);

    // Usernamen-Mapping laden
    useEffect(() => {
        async function fetchUsers() {
            const { data } = await supabase.from('users').select('id, name');
            if (data) {
                const map: Record<string, string> = {};
                data.forEach((u: { id: string; name: string }) => { map[u.id] = u.name; });
                setUserMap(map);
            }
        }
        fetchUsers();
    }, []);

    return (
        <div className="mb-4">
            <h3 className="font-semibold">Scoreboard</h3>
            <ul>
                {scores.map((entry) => (
                    <li key={entry.user_id}>
                        {userMap[entry.user_id] || entry.user_id}: {entry.points} Punkte
                    </li>
                ))}
            </ul>
        </div>
    );
}
