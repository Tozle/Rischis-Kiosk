import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Product = {
    id: string;
    name: string;
    price: number;
    purchase: number;
    stock: number;
    category: string;
};

type User = {
    id: string;
    name: string | null;
    email: string;
    role: 'admin' | 'player';
    balance: number;
};

// Custom-Styles für Panel-Shadow und Glass-Effect
const customStyles = `
.panel-shadow { box-shadow: 0 15px 35px rgba(22, 163, 74, 0.4); }
.dark .panel-shadow { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6); }
.glass-effect { backdrop-filter: blur(14px); background-color: rgba(255,255,255,0.88); }
.dark .glass-effect { background-color: rgba(31,41,55,0.8); }
`;

export default function Admin() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [form, setForm] = useState({ name: '', price: '', purchase: '', stock: '', category: '' });
    const [editId, setEditId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    // Benutzerverwaltung
    const [users, setUsers] = useState<User[]>([]);
    const [userMsg, setUserMsg] = useState('');
    // Statistik
    const [stats, setStats] = useState<{ total: number; count: number; topProducts: { name: string; count: number }[] }>({ total: 0, count: 0, topProducts: [] });
    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        // Gesamtumsatz und Anzahl Käufe
        const { data: purchases } = await supabase.from('purchases').select('price, product_id');
        const total = purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
        const count = purchases?.length || 0;
        // Meistverkaufte Produkte
        const productCounts: Record<string, { name: string; count: number }> = {};
        if (purchases) {
            for (const p of purchases) {
                if (!productCounts[p.product_id]) {
                    // Produktnamen holen
                    const { data: prod } = await supabase.from('products').select('name').eq('id', p.product_id).single();
                    productCounts[p.product_id] = { name: prod?.name || 'Unbekannt', count: 0 };
                }
                productCounts[p.product_id].count++;
            }
        }
        const topProducts = Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5);
        setStats({ total, count, topProducts });
    }
    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        const { data } = await supabase.from('users').select('id, name, email, role, balance');
        setUsers(data || []);
    }

    async function handleRoleChange(id: string, role: string) {
        const { error } = await supabase.from('users').update({ role }).eq('id', id);
        if (!error) setUserMsg('Rolle geändert!');
        else setUserMsg('Fehler beim Ändern der Rolle.');
        fetchUsers();
    }

    async function handleBalanceChange(id: string, balance: number) {
        const { error } = await supabase.from('users').update({ balance }).eq('id', id);
        if (!error) setUserMsg('Guthaben geändert!');
        else setUserMsg('Fehler beim Ändern des Guthabens.');
        fetchUsers();
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data } = await supabase.from('products').select('*').order('name');
        setProducts(data || []);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.price || !form.purchase || !form.stock || !form.category) {
            setMessage('Bitte alle Felder ausfüllen!');
            return;
        }
        if (editId) {
            // Update
            const { error } = await supabase.from('products').update({
                name: form.name,
                price: parseFloat(form.price),
                purchase: parseFloat(form.purchase),
                stock: parseInt(form.stock),
                category: form.category
            }).eq('id', editId);
            if (!error) setMessage('Produkt aktualisiert!');
            else setMessage('Fehler beim Aktualisieren.');
        } else {
            // Insert
            const { error } = await supabase.from('products').insert({
                name: form.name,
                price: parseFloat(form.price),
                purchase: parseFloat(form.purchase),
                stock: parseInt(form.stock),
                category: form.category
            });
            if (!error) setMessage('Produkt hinzugefügt!');
            else setMessage('Fehler beim Hinzufügen.');
        }
        setForm({ name: '', price: '', purchase: '', stock: '', category: '' });
        setEditId(null);
        fetchProducts();
    }

    async function handleDelete(id: string) {
        if (!confirm('Produkt wirklich löschen?')) return;
        await supabase.from('products').delete().eq('id', id);
        fetchProducts();
    }

    function handleEdit(product: Product) {
        setEditId(product.id);
        setForm({
            name: product.name,
            price: product.price.toString(),
            purchase: product.purchase.toString(),
            stock: product.stock.toString(),
            category: product.category
        });
    }

    // Accordion-State für Sektionen
    const [openSection, setOpenSection] = useState<string | null>(null);
    function toggleSection(id: string) {
        setOpenSection(openSection === id ? null : id);
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Lade...</div>;

    return (
        <>
            <style>{customStyles}</style>
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
                <div className="w-full px-3 py-4 sm:py-6 max-w-screen-lg mx-auto mt-6 sm:mt-8 p-4 sm:p-6 rounded-3xl panel-shadow border-4 border-green-300 dark:border-green-500 glass-effect animate-fade-in bg-white/90 dark:bg-slate-900/90">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-green-800 dark:text-green-200">Adminbereich – Rischis Kiosk</h1>
                    {/* Produktverwaltung */}
                    <section className="mb-8">
                        <button type="button" onClick={() => toggleSection('products')} className="w-full relative flex justify-center bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 px-4 py-3 rounded-lg font-semibold text-gray-800 dark:text-white transition">
                            <span>Produkte verwalten</span>
                            <span className="absolute right-4 arrow">{openSection === 'products' ? '▲' : '▼'}</span>
                        </button>
                        <div className={openSection === 'products' ? 'mt-4' : 'mt-4 hidden'}>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input type="text" placeholder="Produktname" className="p-3 border rounded w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                    <input type="number" step="0.01" placeholder="Verkaufspreis (€)" className="p-3 border rounded w-full" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                                    <input type="number" step="0.01" placeholder="Einkaufspreis (€)" className="p-3 border rounded w-full" value={form.purchase} onChange={e => setForm(f => ({ ...f, purchase: e.target.value }))} required />
                                    <input type="number" placeholder="Bestand" className="p-3 border rounded w-full" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
                                    <select className="p-3 border rounded w-full" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                                        <option value="">Kategorie wählen</option>
                                        <option value="Drinks">Drinks</option>
                                        <option value="Snacks">Snacks</option>
                                        <option value="Supplies">Supplies</option>
                                    </select>
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700">{editId ? 'Aktualisieren' : 'Hinzufügen'}</button>
                                {editId && <button type="button" className="ml-2 px-4 py-3 rounded bg-gray-300 dark:bg-gray-700" onClick={() => { setEditId(null); setForm({ name: '', price: '', purchase: '', stock: '', category: '' }); }}>Abbrechen</button>}
                                <p className="mt-2 text-center text-sm">{message}</p>
                            </form>
                            <div className="mt-8 overflow-x-auto">
                                <table className="table-auto w-full text-center text-base">
                                    <thead>
                                        <tr>
                                            <th className="px-2 py-1 border-b font-semibold">Name</th>
                                            <th className="px-2 py-1 border-b font-semibold">VK (€)</th>
                                            <th className="px-2 py-1 border-b font-semibold">EK (€)</th>
                                            <th className="px-2 py-1 border-b font-semibold">Bestand</th>
                                            <th className="px-2 py-1 border-b font-semibold">Kategorie</th>
                                            <th className="px-2 py-1 border-b font-semibold">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} className="odd:bg-green-50 dark:odd:bg-gray-700">
                                                <td className="px-2 py-1 border-b">{p.name}</td>
                                                <td className="px-2 py-1 border-b">{p.price.toFixed(2)}</td>
                                                <td className="px-2 py-1 border-b">{p.purchase.toFixed(2)}</td>
                                                <td className="px-2 py-1 border-b">{p.stock}</td>
                                                <td className="px-2 py-1 border-b">{p.category}</td>
                                                <td className="px-2 py-1 border-b">
                                                    <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 px-3 rounded mr-2" onClick={() => handleEdit(p)}>Bearbeiten</button>
                                                    <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded" onClick={() => handleDelete(p.id)}>Löschen</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                    {/* Statistik */}
                    <section className="mb-8">
                        <button type="button" onClick={() => toggleSection('stats')} className="w-full relative flex justify-center bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 px-4 py-3 rounded-lg font-semibold text-gray-800 dark:text-white transition">
                            <span>Statistik</span>
                            <span className="absolute right-4 arrow">{openSection === 'stats' ? '▲' : '▼'}</span>
                        </button>
                        <div className={openSection === 'stats' ? 'mt-4' : 'mt-4 hidden'}>
                            <div className="space-y-2">
                                <div><strong>Gesamtumsatz:</strong> {stats.total.toFixed(2)} €</div>
                                <div><strong>Anzahl Käufe:</strong> {stats.count}</div>
                                <div>
                                    <strong>Meistverkaufte Produkte:</strong>
                                    <ul className="list-disc ml-6">
                                        {stats.topProducts.length === 0 && <li>Keine Daten</li>}
                                        {stats.topProducts.map((p, i) => (
                                            <li key={i}>{p.name} ({p.count}x)</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* Benutzerverwaltung */}
                    <section className="mb-8">
                        <button type="button" onClick={() => toggleSection('users')} className="w-full relative flex justify-center bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600 px-4 py-3 rounded-lg font-semibold text-gray-800 dark:text-white transition">
                            <span>Benutzer verwalten</span>
                            <span className="absolute right-4 arrow">{openSection === 'users' ? '▲' : '▼'}</span>
                        </button>
                        <div className={openSection === 'users' ? 'mt-4' : 'mt-4 hidden'}>
                            <div className="overflow-x-auto">
                                <table className="table-auto w-full text-center text-base">
                                    <thead>
                                        <tr>
                                            <th className="px-2 py-1 border-b font-semibold">Name</th>
                                            <th className="px-2 py-1 border-b font-semibold">E-Mail</th>
                                            <th className="px-2 py-1 border-b font-semibold">Rolle</th>
                                            <th className="px-2 py-1 border-b font-semibold">Guthaben (€)</th>
                                            <th className="px-2 py-1 border-b font-semibold">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="odd:bg-green-50 dark:odd:bg-gray-700">
                                                <td className="px-2 py-1 border-b">{u.name || '-'}</td>
                                                <td className="px-2 py-1 border-b">{u.email}</td>
                                                <td className="px-2 py-1 border-b">
                                                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="p-1 rounded">
                                                        <option value="player">Player</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-2 py-1 border-b">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={u.balance}
                                                        onChange={e => handleBalanceChange(u.id, parseFloat(e.target.value))}
                                                        className="w-24 p-1 rounded text-right"
                                                    />
                                                </td>
                                                <td className="px-2 py-1 border-b text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="mt-2 text-center text-sm">{userMsg}</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
