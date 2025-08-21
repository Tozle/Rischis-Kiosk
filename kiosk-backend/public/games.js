// --- Make $ and showToast globally accessible ---
window.$ = function (id) { return document.getElementById(id); };
window.showToast = function (msg, type = 'success', duration = 3000, undoCallback = null) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = msg;
    toast.appendChild(span);
    if (undoCallback) {
        const btn = document.createElement('button');
        btn.textContent = 'Rückgängig';
        btn.className = 'ml-4 px-3 py-1 rounded bg-white/80 text-green-700 font-bold shadow hover:bg-green-100 transition text-xs';
        btn.onclick = () => {
            undoCallback();
            toast.classList.add('opacity-0');
        };
        toast.appendChild(btn);
    }
    toast.className = `fixed left-1/2 top-6 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-sm font-semibold transition-opacity duration-300 pointer-events-none ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white opacity-100`;
    if (!undoCallback) {
        setTimeout(() => {
            toast.classList.add('opacity-0');
        }, duration);
    }
};
async function heartbeat() {
    try {
        await fetch('/api/online-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                session_id: sessionStorage.getItem('games_session_id'),
                page: 'games',
                username: (JSON.parse(localStorage.getItem('user_profile') || '{}').name) || '',
                profile_image_url: (JSON.parse(localStorage.getItem('user_profile') || '{}').image) || ''
            })
        });
    } catch (e) { /* Fehler ignorieren */ }
}
window.heartbeat = heartbeat;

async function fetchOnlineUsers() {
    try {
        const res = await fetch('/api/online-users?page=games', { credentials: 'include' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.users || [];
    } catch (e) {
        return [];
    }
}

async function updateOnlineUI() {
    const users = await fetchOnlineUsers();
    const unique = users.filter((u, i, arr) => arr.findIndex(x => x.session_id === u.session_id) === i);
    const onlineCount = $("games-online-count");
    if (onlineCount) onlineCount.textContent = unique.length;
    const onlineList = $("games-online-list");
    if (onlineList) {
        if (!unique.length) {
            onlineList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 mx-auto mb-2 text-cyan-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
                <div class="font-semibold">Noch keine Spieler online.</div>
            </div>`;
        } else {
            onlineList.innerHTML = '<div class="flex flex-wrap gap-4 justify-center">' +
                unique.map(u => `<div class="flex flex-col items-center">
                    <img src="${u.profile_image_url}" alt="${u.username}" class="w-12 h-12 rounded-full border border-gray-300 object-cover mb-1" style="background:#eee;" />
                    <span class="text-xs font-medium">${u.username}</span>
                </div>`).join('') + '</div>';
        }
    }
}
// ...restlicher Code (alle Event-Listener, DOMContentLoaded, Funktionen, etc.) muss hier außerhalb stehen...
