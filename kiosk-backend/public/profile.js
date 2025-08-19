// Profileinstellungen-Logik für dashboard.html
window.addEventListener('DOMContentLoaded', async () => {
  // Button und Modal referenzieren
  const profileBtn = document.getElementById('profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const profileClose = document.getElementById('profile-close');
  const profileForm = document.getElementById('profile-form');
  const profileMessage = document.getElementById('profile-message');
  const usernameInput = document.getElementById('profile-username');

  // Modal öffnen
  if (profileBtn && profileModal) {
    profileBtn.addEventListener('click', async () => {
      // Hole aktuellen Usernamen
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        usernameInput.value = data?.user?.name || '';
      } catch {
        usernameInput.value = '';
      }
      profileModal.classList.remove('hidden');
      usernameInput.focus();
    });
  }
  // Modal schließen
  if (profileClose && profileModal) {
    profileClose.addEventListener('click', () => {
      profileModal.classList.add('hidden');
      profileMessage.textContent = '';
    });
  }
  // Formular absenden
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = document.getElementById('profile-password').value;
      const repeat = document.getElementById('profile-password-repeat').value;
      if (password && password !== repeat) {
        profileMessage.textContent = 'Passwörter stimmen nicht überein.';
        profileMessage.className = 'text-red-500';
        return;
      }
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: username, password: password || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');
        profileMessage.textContent = 'Profil erfolgreich gespeichert!';
        profileMessage.className = 'text-green-600';
        setTimeout(() => profileModal.classList.add('hidden'), 1200);
      } catch (err) {
        profileMessage.textContent = err.message || 'Fehler beim Speichern';
        profileMessage.className = 'text-red-500';
      }
    });
  }
});
