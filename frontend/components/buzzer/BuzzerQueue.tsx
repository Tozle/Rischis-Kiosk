import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface QueueEntry {
    id: string;
    user_id: string;
    pressed_at: string;
    queue_pos: number;
    consumed: boolean;
    result: 'correct' | 'wrong' | 'skipped' | null;
}

export function BuzzerQueue({ round_id }: { round_id: string | null }) {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    useEffect(() => {
        if (!round_id) return;
        let ignore = false;
        async function fetchQueue() {
            const { data, error } = await supabase
                .from('buzzer_presses')
                .select('*')
                .eq('round_id', round_id)
                .order('queue_pos', { ascending: true });
            if (!ignore && data) setQueue(data.slice(0, 5));
        }
        fetchQueue();
        const sub = supabase
            .from(`buzzer_presses:round_id=eq.${round_id}`)
            .on('INSERT', fetchQueue)
            .on('UPDATE', fetchQueue)
            .subscribe();
        return () => {
            ignore = true;
            supabase.removeSubscription(sub);
        };
    }, [round_id]);
    return (
        <div className="mb-4">
            <h3 className="font-semibold">Buzzer-Queue (Top 5)</h3>
            <ul>
                {queue.map((entry) => (
                    <li key={entry.id}>
                        {entry.user_id} (#{entry.queue_pos})
                        {entry.consumed ? ` [${entry.result}]` : ''}
                    </li>
                ))}
            </ul>
        </div>
    );
}
