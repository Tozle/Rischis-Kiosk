const SUPABASE_URL = "https://izkuiqjhzeeirmcikbef.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a3VpcWpoemVlaXJtY2lrYmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDAwOTQsImV4cCI6MjA2NDM3NjA5NH0.mPu0jQYnt0uGoLgehNFDHZprEcmrzGJ667D31sLSbj0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = supabase;

window.toggleDarkMode = function () {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
};

window.initDarkMode = function () {
  if (localStorage.getItem('darkMode') !== 'false') {
    document.documentElement.classList.add('dark');
  }
};

function getBerlinTimestamp() {
  const berlinString = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
  return new Date(berlinString).toISOString();
}

async function updateLastActive(userId) {
  if (!userId || !window.supabase) return;
  const timestamp = getBerlinTimestamp();
  await supabase.from('user_sessions').upsert({ user_id: userId, last_active: timestamp });
}

function setupActivityTracking(userId) {
  const events = ['mousemove', 'keydown', 'click', 'touchstart'];
  const handler = () => updateLastActive(userId);
  events.forEach(event => document.addEventListener(event, handler));
  updateLastActive(userId);
}
