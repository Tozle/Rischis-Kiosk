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
