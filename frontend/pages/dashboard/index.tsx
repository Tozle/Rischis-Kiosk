import Link from 'next/link';

export default function Dashboard() {
    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="flex flex-col gap-4">
                {/* Beispiel für andere Dashboard-Buttons */}
                <Link href="/dashboard/shop" legacyBehavior>
                    <a className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow text-center transition-all">Shop</a>
                </Link>
                <Link href="/dashboard/buzzer" legacyBehavior>
                    <a className="block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow text-center transition-all">Buzzer-Spiel</a>
                </Link>
                {/* Weitere Buttons hier ... */}
            </div>
        </div>
    );
}
