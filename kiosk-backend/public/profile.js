// Profileinstellungen-Logik für dashboard.html
window.addEventListener('DOMContentLoaded', async () => {
  // Button und Modal referenzieren
  const profileBtn = document.getElementById('profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const profileClose = document.getElementById('profile-close');
  const profileForm = document.getElementById('profile-form');
  const profileMessage = document.getElementById('profile-message');
  const usernameInput = document.getElementById('profile-username');
  const imageUrlInput = document.getElementById('profile-image-url');

  if (!profileBtn) {
    console.warn('Profileinstellungen-Button (profile-btn) nicht im DOM gefunden!');
    return;
  }
  if (!profileModal) {
    console.warn('Profileinstellungen-Modal (profile-modal) nicht im DOM gefunden!');
    return;
  }

  // Profileinstellungen-Button und Modal standardmäßig ausblenden
  if (profileBtn) profileBtn.style.display = 'none';
  if (profileModal) profileModal.style.display = 'none';

  // Prüfe Login und Rolle
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (data?.loggedIn) {
      if (profileBtn) {
        profileBtn.style.display = '';
        // Profilbild als Button anzeigen, falls vorhanden
        const imgUrl = data.user?.profile_image_url;
        if (imgUrl) {
          profileBtn.innerHTML = `<img src="${imgUrl}" alt="Profilbild" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`;
        } else {
          profileBtn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' class='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>`;
        }
      }
      if (profileModal) profileModal.style.display = '';
      // Adminbereich-Button nur für Admins einblenden
      const adminBtn = document.getElementById('admin-btn');
      if (adminBtn) {
        if (data.user?.role === 'admin') {
          adminBtn.classList.remove('hidden');
        } else {
          adminBtn.classList.add('hidden');
        }
      }
    }
  } catch {}

  // Modal öffnen
  if (profileBtn && profileModal) {
    profileBtn.addEventListener('click', async () => {
      // Hole aktuellen Usernamen und Profilbild
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        usernameInput.value = data?.user?.name || '';
        imageUrlInput.value = data?.user?.profile_image_url || '';
      } catch {
        usernameInput.value = '';
        imageUrlInput.value = '';
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
      const imageUrl = imageUrlInput.value.trim();
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
          body: JSON.stringify({ name: username, password: password || undefined, profile_image_url: imageUrl || undefined }),
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
