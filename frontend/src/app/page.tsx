import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-green-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-lg mx-auto p-10 rounded-2xl shadow-2xl bg-white/90 dark:bg-slate-900/90 flex flex-col items-center gap-8">
        <h1 className="text-4xl font-extrabold text-green-700 dark:text-cyan-300 tracking-tight mb-2 drop-shadow text-center">Willkommen bei Rischis Kiosk!</h1>
        <p className="text-lg text-gray-700 dark:text-gray-200 text-center max-w-md">Dein digitaler Kiosk für Snacks, Spiele und mehr. Logge dich ein oder gehe direkt zum Dashboard, um loszulegen!</p>
        <Link href="/dashboard" legacyBehavior>
          <a className="block bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg text-center transition-all duration-200 transform hover:scale-105">Zum Dashboard</a>
        </Link>
        <Link href="/login" legacyBehavior>
          <a className="block bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white text-lg font-semibold py-3 px-6 rounded-xl shadow text-center transition-all duration-200 mt-2">Login</a>
        </Link>
        <p className="text-gray-400 text-xs mt-8 text-center">© {new Date().getFullYear()} Rischis Kiosk</p>
      </div>
    </div>
  );
}
