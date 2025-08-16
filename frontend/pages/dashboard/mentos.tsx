
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

type Feeding = {
    id: string;
    created_at: string;
    type: string;
    user_name: string;
};

export default function Mentos() {
    const [feedings, setFeedings] = useState<Feeding[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [lastFeedDisplay, setLastFeedDisplay] = useState('-');
    const [lastFeedColor, setLastFeedColor] = useState('text-green-600');

    // Lade Feedings und User
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            // User laden
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
                setIsAdmin(data?.role === 'admin');
            }
            // Feedings laden
            const { data: feedingsData } = await supabase
                .from('feedings')
                .select('id, created_at, type, user_name')
                .order('created_at', { ascending: false })
                .limit(20);
            setFeedings(feedingsData || []);
            setLoading(false);
            if (feedingsData && feedingsData.length > 0) {
                startCountdown(feedingsData[0].created_at);
            } else {
                setLastFeedDisplay('-');
                setLastFeedColor('text-green-600');
            }
        }
        fetchData();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line
    }, []);

    // Countdown für letzte Fütterung
    function startCountdown(lastFeedTime: string) {
        function update() {
            const diff = Date.now() - new Date(lastFeedTime).getTime();
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            setLastFeedDisplay(`${hours}h ${minutes}m`);
            if (hours < 4) setLastFeedColor('text-green-600');
            else if (hours < 8) setLastFeedColor('text-orange-600');
            else setLastFeedColor('text-red-600');
        }
        update();
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(update, 60000);
    }

    // Fütterung eintragen
    async function addFeeding(type: string) {
        if (!user) return;
        await supabase.from('feedings').insert({
            type,
            user_id: user.id,
            user_name: user.user_metadata?.name || user.email || ''
        });
        // Neu laden
        const { data: feedingsData } = await supabase
            .from('feedings')
            .select('id, created_at, type, user_name')
            .order('created_at', { ascending: false })
            .limit(20);
        setFeedings(feedingsData || []);
        if (feedingsData && feedingsData.length > 0) {
            startCountdown(feedingsData[0].created_at);
        }
    }

    // Admin: Historie löschen
    async function clearFeedings() {
        if (!isAdmin) return;
        await supabase.from('feedings').delete().neq('id', '');
        setFeedings([]);
        setLastFeedDisplay('-');
        setLastFeedColor('text-green-600');
    }

    // Admin: Timer zurücksetzen
    function resetTimerDisplay() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLastFeedDisplay('-');
        setLastFeedColor('text-green-600');
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Lade...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-cyan-100 dark:from-slate-900 dark:to-slate-800 text-green-900 dark:text-white">
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => {
                        document.documentElement.classList.toggle('dark');
                        localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? 'true' : 'false');
                    }}
                    className="bg-gray-300/75 dark:bg-gray-700/75 text-black dark:text-white p-2 rounded-full shadow opacity-70 hover:opacity-100 transition"
                >
                    🌙
                </button>
            </div>
            <div className="fixed top-4 left-4 z-50">
                <Link href="/dashboard" legacyBehavior>
                    <a className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-full shadow text-sm">⬅️ Zurück zum Dashboard</a>
                </Link>
            </div>
            <div className="w-full px-3 py-2 max-w-screen-sm mx-auto mt-12 sm:mt-20 p-6 sm:p-10 rounded-3xl panel-shadow border-4 border-green-300 dark:border-green-500 glass-effect animate-fade-in bg-white/90 dark:bg-slate-900/90">
                <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-green-800 dark:text-green-200">Mentos 🐱</h1>
                <h2 className="text-xl text-center">Letzte Fütterung vor:</h2>
                <div className={`text-4xl sm:text-5xl font-mono font-semibold text-center mb-4 ${lastFeedColor}`}>
                    {lastFeedDisplay}
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow"
                        onClick={() => addFeeding('Nassfutter')}
                    >
                        🐟 Nassfutter gegeben
                    </button>
                    <button
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-full shadow"
                        onClick={() => addFeeding('Trockenfutter')}
                    >
                        🥣 Trockenfutter gegeben
                    </button>
                </div>
                {isAdmin && (
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1 px-2 rounded-full shadow"
                            onClick={() => { if (confirm('Timer wirklich zurücksetzen?')) resetTimerDisplay(); }}
                        >⏱️ Timer zurücksetzen</button>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1 px-2 rounded-full shadow"
                            onClick={() => { if (confirm('Anzeige wirklich löschen?')) clearFeedings(); }}
                        >🗑️ Anzeige löschen</button>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-center text-base">
                        <thead>
                            <tr>
                                <th className="px-2 py-1 border-b font-semibold">Zeit</th>
                                <th className="px-2 py-1 border-b font-semibold">Futterart</th>
                                <th className="px-2 py-1 border-b font-semibold">Gefüttert von</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedings.map((e) => (
                                <tr key={e.id} className="odd:bg-green-50 dark:odd:bg-gray-700">
                                    <td className="px-2 py-1 border-b">{new Date(e.created_at).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</td>
                                    <td className="px-2 py-1 border-b">{e.type}</td>
                                    <td className="px-2 py-1 border-b">{e.user_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
