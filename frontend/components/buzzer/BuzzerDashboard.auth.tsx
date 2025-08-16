import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BuzzerAdminPanel } from './BuzzerAdminPanel';
import { BuzzerPlayerPanel } from './BuzzerPlayerPanel';



export function BuzzerDashboard() {
    const [role, setRole] = useState<'admin' | 'player' | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRole(null);
                setUserId(null);
                setLoading(false);
                return;
            }
            setUserId(user.id);
            // Hole Rolle aus users-Tabelle (z.B. Feld "role")
            const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
            setRole(data?.role === 'admin' ? 'admin' : 'player');
            setLoading(false);
        }
        fetchUser();
    }, []);

    if (loading) return <div>Lade...</div>;
    if (!role || !userId) return <div>Bitte einloggen.</div>;
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Buzzer-Spiel</h1>
            {role === 'admin' ? (
                <BuzzerAdminPanel onRoundChange={setCurrentRoundId} />
            ) : (
                <BuzzerPlayerPanel round_id={currentRoundId} user_id={userId} />
            )}
        </div>
    );
}
