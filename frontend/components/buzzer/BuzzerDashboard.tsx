import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BuzzerAdminPanel } from './BuzzerAdminPanel';
import { BuzzerPlayerPanel } from './BuzzerPlayerPanel';

export function BuzzerDashboard() {
    const [role, setRole] = useState<'admin' | 'player' | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [userAvatar, setUserAvatar] = useState<string>('');
    const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRole(null);
                setUserId(null);
                setUserName('');
                setUserAvatar('');
                setLoading(false);
                return;
            }
            setUserId(user.id);
            setUserAvatar(user.user_metadata?.avatar_url || '');
            // Hole Rolle und Namen aus users-Tabelle
            const { data } = await supabase.from('users').select('role, name, avatar_url').eq('id', user.id).single();
            setRole(data?.role === 'admin' ? 'admin' : 'player');
            setUserName(data?.name || user.email || '');
            setUserAvatar(data?.avatar_url || user.user_metadata?.avatar_url || '');
            setLoading(false);
        }
        fetchUser();
    }, []);

    // Runde aus AdminPanel übernehmen (Callback)
    function handleRoundChange(roundId: string | null) {
        setCurrentRoundId(roundId);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.reload();
    }

    if (loading) return <div>Lade...</div>;
    if (!role || !userId) return <div>Bitte einloggen.</div>;
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-cyan-50 via-green-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                {userAvatar && <img src={userAvatar} alt="Avatar" className="w-10 h-10 rounded-full border shadow transition-transform duration-300 hover:scale-105" />}
                <span className="font-semibold text-sm max-w-[120px] truncate" title={userName}>{userName}</span>
                <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-xs font-semibold shadow transition-all duration-200 active:scale-95">Logout</button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center mt-8 sm:mt-12 drop-shadow">Buzzer-Spiel</h1>
            <div className="w-full max-w-2xl mx-auto px-2 sm:px-0 animate-fade-in">
                {role === 'admin' ? (
                    <BuzzerAdminPanel onRoundChange={handleRoundChange} />
                ) : (
                    <BuzzerPlayerPanel round_id={currentRoundId} user_id={userId} />
                )}
            </div>
            <style jsx global>{`
                    .animate-fade-in { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1); }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
                    button, .buzzer-btn { touch-action: manipulation; }
                `}</style>
        </div>
    );
}
