import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
    const [role, setRole] = useState<'admin' | 'player' | null>(null);
    const [userName, setUserName] = useState('');
    const [userAvatar, setUserAvatar] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRole(null);
                setUserName('');
                setUserAvatar('');
                setLoading(false);
                return;
            }
            setUserAvatar(user.user_metadata?.avatar_url || '');
            const { data } = await supabase.from('users').select('role, name, avatar_url').eq('id', user.id).single();
            setRole(data?.role === 'admin' ? 'admin' : 'player');
            setUserName(data?.name || user.email || '');
            setUserAvatar(data?.avatar_url || user.user_metadata?.avatar_url || '');
            setLoading(false);
        }
        fetchUser();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Lade...</div>;
    if (!role) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-green-100 dark:from-slate-900 dark:to-slate-800">
            <div className="bg-white/90 dark:bg-slate-900/90 p-8 rounded-2xl shadow-2xl text-center">
                <h1 className="text-2xl font-bold mb-4">Bitte einloggen</h1>
                <Link href="/login" legacyBehavior>
                    <a className="text-blue-600 hover:underline">Zum Login</a>
                </Link>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
            .panel-shadow { box-shadow: 0 15px 35px rgba(22, 163, 74, 0.4); }
            .dark .panel-shadow { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6); }
            .glass-effect { backdrop-filter: blur(14px); background-color: rgba(255,255,255,0.88); }
            .dark .glass-effect { background-color: rgba(31,41,55,0.8); }
            .dashboard-btn { @apply w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-cyan-400 hover:from-green-600 hover:to-cyan-500 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-xl text-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400; }
            .dashboard-btn-admin { @apply from-green-600 to-emerald-400 hover:from-green-700 hover:to-emerald-500 border-2 border-green-800; }
            `}</style>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-green-100 dark:from-slate-900 dark:to-slate-800">
                <div className="w-full max-w-md mx-auto p-6 sm:p-10 rounded-3xl panel-shadow glass-effect flex flex-col items-center gap-10 animate-fade-in">
                    <button className="flex flex-col items-center gap-2 focus:outline-none" style={{ background: 'none', border: 'none' }}>
                        {userAvatar && <img src={userAvatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-green-300 dark:border-green-600 shadow-xl" />}
                        <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">{userName}</span>
                    </button>
                    <h1 className="text-4xl font-extrabold text-green-700 dark:text-cyan-300 tracking-tight mb-2 drop-shadow">Rischis Kiosk Dashboard</h1>
                    <div className="flex flex-col w-full gap-6 mt-2">
                        <Link href="/dashboard/buzzer" legacyBehavior>
                            <a className="dashboard-btn bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500">🔔 Buzzer-Spiel</a>
                        </Link>
                        <Link href="/dashboard/shop" legacyBehavior>
                            <a className="dashboard-btn bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500">🛒 Shop</a>
                        </Link>
                        <Link href="/dashboard/mentos" legacyBehavior>
                            <a className="dashboard-btn bg-gradient-to-r from-pink-400 to-fuchsia-500 hover:from-pink-500 hover:to-fuchsia-600">🍬 Mentos</a>
                        </Link>
                        {role === 'admin' && (
                            <Link href="/dashboard/admin" legacyBehavior>
                                <a className="dashboard-btn dashboard-btn-admin">�️ Adminbereich</a>
                            </Link>
                        )}
                    </div>
                    <p className="text-gray-500 text-xs mt-8 text-center">Willkommen bei Rischis Kiosk!<br />Viel Spaß 🎉</p>
                </div>
            </div>
        </>
    );
}
