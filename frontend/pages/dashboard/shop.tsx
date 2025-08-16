
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Product = {
    id: string;
    name: string;
    price: number;
};

type Purchase = {
    id: string;
    product_id: string;
    created_at: string;
    price: number;
    product: { name: string };
};

type User = {
    id: string;
    email?: string;
    user_metadata?: { name?: string };
};

export default function Shop() {
    // Produktdaten, Userdaten etc.
    const [products, setProducts] = useState<Product[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState<Purchase[]>([]);


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            // User laden
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            let userBalance = 0;
            if (user) {
                // Hole Guthaben aus Tabelle users
                const { data: userData } = await supabase
                    .from('users')
                    .select('balance')
                    .eq('id', user.id)
                    .single();
                userBalance = userData?.balance || 0;
                // Hole Kaufhistorie
                const { data: purchasesData } = await supabase
                    .from('purchases')
                    .select('id, product_id, created_at, price, product:products!purchases_product_id_fkey(name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                // product als Objekt statt Array
                setPurchases(
                    (purchasesData || []).map((p: any) => ({
                        ...p,
                        product: Array.isArray(p.product) ? p.product[0] : p.product
                    }))
                );
            }
            setBalance(userBalance);
            // Produkte laden
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });
            setProducts(productsData || []);
            setLoading(false);
        }
        fetchData();
    }, []);

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
            <div className="shop-container w-full px-4 py-4 sm:py-6 max-w-2xl mx-auto mt-16 sm:mt-24 rounded-3xl panel-shadow border-4 border-green-300 dark:border-green-500 glass-effect animate-fade-in bg-white/90 dark:bg-slate-900/90">
                <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-green-800 dark:text-green-200">Rischis Kiosk</h1>
                <div className="mb-6">
                    <p><strong>Angemeldet als:</strong> <span>{user?.email || '-'}</span></p>
                    <p><strong>Guthaben:</strong> <span className="font-bold">{balance.toFixed(2)} €</span></p>
                </div>
                <div className="mt-8">
                    <h2 className="text-lg sm:text-xl font-bold tracking-wide text-gray-800 dark:text-gray-100 uppercase mb-4">Verfügbare Produkte</h2>
                    <ul className="overflow-x-auto block space-y-4">
                        {products.length === 0 && <li className="text-center text-gray-400">Keine Produkte gefunden.</li>}
                        {products.map((product: Product) => (
                            <li key={product.id} className="flex items-center justify-between bg-green-50 dark:bg-slate-800 rounded-lg p-4 shadow gap-2">
                                <span className="font-semibold">{product.name}</span>
                                <span className="text-green-700 dark:text-green-300 font-bold">{product.price?.toFixed(2)} €</span>
                                <button
                                    className="ml-4 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded shadow text-sm transition disabled:opacity-50"
                                    disabled={!user || balance < product.price}
                                    onClick={async () => {
                                        if (!user) return;
                                        // Kauf in Supabase eintragen
                                        const { error } = await supabase.from('purchases').insert({
                                            user_id: user.id,
                                            product_id: product.id,
                                            price: product.price
                                        });
                                        if (!error) {
                                            // Guthaben und Kaufhistorie neu laden
                                            const { data: userData } = await supabase
                                                .from('users')
                                                .select('balance')
                                                .eq('id', user.id)
                                                .single();
                                            setBalance(userData?.balance || 0);
                                            const { data: purchasesData } = await supabase
                                                .from('purchases')
                                                .select('id, product_id, created_at, price, product:products!purchases_product_id_fkey(name)')
                                                .eq('user_id', user.id)
                                                .order('created_at', { ascending: false })
                                                .limit(10);
                                            setPurchases(
                                                (purchasesData || []).map((p: any) => ({
                                                    ...p,
                                                    product: Array.isArray(p.product) ? p.product[0] : p.product
                                                }))
                                            );
                                        } else {
                                            alert('Kauf fehlgeschlagen: ' + error.message);
                                        }
                                    }}
                                >Kaufen</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-12">
                    <h2 className="text-lg sm:text-xl font-bold tracking-wide text-gray-800 dark:text-gray-100 uppercase mb-4">Kaufverlauf</h2>
                    <ul className="overflow-x-auto block space-y-2 text-sm">
                        {purchases.length === 0 && <li className="text-center text-gray-400">Noch keine Käufe.</li>}
                        {purchases.map((purchase) => (
                            <li key={purchase.id} className="flex items-center justify-between bg-green-50 dark:bg-slate-800 rounded-lg p-2 shadow">
                                <span>{purchase.product?.name || 'Produkt'}</span>
                                <span className="text-green-700 dark:text-green-300 font-bold">{purchase.price?.toFixed(2)} €</span>
                                <span className="text-xs text-gray-400 ml-2">{new Date(purchase.created_at).toLocaleString('de-DE')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Styles für Panel-Shadow und Glass-Effect (Tailwind + Custom)
// Die Logik für Produkte/User wird später mit Supabase ergänzt.
