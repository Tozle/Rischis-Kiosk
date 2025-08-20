// Profileinstellungen-Logik für dashboard.html (Best Practice Refactor)

import { $ } from './utils/frontend.js';
document.addEventListener('DOMContentLoaded', () => {

    // Zentrale Meldung für Auswahl
    let profileMessage = $('profile-message');
    if (!profileMessage) {
        profileMessage = document.createElement('div');
        profileMessage.id = 'profile-message';
        profileMessage.className = 'mb-2 text-center text-sm';
        const choice = $('profile-choice');
        if (choice && choice.parentNode) {
            choice.parentNode.insertBefore(profileMessage, choice.nextSibling);
        }
    }

    // DOM-Referenzen
    const profileBtn = $('profile-btn');
    const profileModal = $('profile-modal');
    const profileClose = $('profile-close');
    const imageForm = $('profile-image-form');
    const imageUrlInput = $('profile-image-url');
    const imagePreview = $('profile-image-preview');
    const imageError = $('profile-image-error');
    const imageMessage = $('profile-image-message');
    const nameForm = $('profile-name-form');
    const usernameInput = $('profile-username');
    const nameMessage = $('profile-name-message');
    const passwordForm = $('profile-password-form');
    const passwordInput = $('profile-password');
    const passwordRepeatInput = $('profile-password-repeat');
    const passwordMessage = $('profile-password-message');

    if (!profileBtn || !profileModal) return;
    profileModal.style.display = 'none';

    // Userdaten laden und Profilbild setzen
    let userData = null;
    fetch('/api/auth/me', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
            if (data?.loggedIn) {
                userData = data.user;
                setProfileBtnImage(data.user?.profile_image_url);
                try {
                    localStorage.setItem('user_profile', JSON.stringify({
                        name: data.user?.name || '',
                        image: data.user?.profile_image_url || ''
                    }));
                } catch { }
                // Adminbereich-Button nur für Admins
                const adminBtn = $('admin-btn');
                if (adminBtn) {
                    if (data.user?.role === 'admin') adminBtn.classList.remove('hidden');
                    else adminBtn.classList.add('hidden');
                }
            }
            if (profileModal) profileModal.style.display = '';
        });

    // Profilbild als Button setzen
    function setProfileBtnImage(imgUrl) {
        if (!profileBtn) return;
        profileBtn.innerHTML = '';
        if (imgUrl) {
            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = 'Profilbild';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '9999px';
            profileBtn.appendChild(img);
        } else {
            const svg = document.createElement('span');
            svg.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' class='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>`;
            profileBtn.appendChild(svg);
        }
    }

    // Modal öffnen
    profileBtn.addEventListener('click', async () => {
        let user = userData;
        if (!user) {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                const data = await res.json();
                if (data?.loggedIn) user = data.user;
            } catch { }
        }
        if (!user) {
            alert('Bitte zuerst einloggen, um die Profileinstellungen zu öffnen.');
            return;
        }
        if (usernameInput) usernameInput.value = user?.name || '';
        if (imageUrlInput) imageUrlInput.value = user?.profile_image_url || '';
        // Guthaben anzeigen
        const balanceElem = $('profile-balance');
        if (balanceElem) {
            const balance = user?.balance;
            if (typeof balance === 'number') {
                balanceElem.textContent = balance.toFixed(2).replace('.', ',') + ' €';
                balanceElem.classList.toggle('text-red-600', balance < 0);
                balanceElem.classList.toggle('text-green-700', balance >= 0);
            } else {
                balanceElem.textContent = '–';
                balanceElem.classList.remove('text-red-600', 'text-green-700');
            }
        }
        // Auswahl anzeigen, Formulare ausblenden
        const choice = $('profile-choice');
        if (choice) choice.classList.remove('hidden');
        if (imageForm) imageForm.classList.add('hidden');
        if (nameForm) nameForm.classList.add('hidden');
        if (passwordForm) passwordForm.classList.add('hidden');
        if (profileMessage) profileMessage.textContent = '';
        profileModal.classList.remove('hidden');
    });

    // Modal schließen
    if (profileClose) {
        profileClose.addEventListener('click', () => {
            profileModal.classList.add('hidden');
            profileMessage.textContent = '';
        });
    }

    // Auswahl-Buttons (Profilbild, Name, Passwort)
    [['profile-choice-image', imageForm], ['profile-choice-name', nameForm], ['profile-choice-password', passwordForm]].forEach(([btnId, form]) => {
        const btn = $(btnId);
        if (btn && form) {
            btn.onclick = () => {
                $('profile-choice').classList.add('hidden');
                [imageForm, nameForm, passwordForm].forEach(f => f && f.classList.add('hidden'));
                form.classList.remove('hidden');
                if (profileMessage) profileMessage.textContent = '';
            };
        }
    });

    // Abbrechen-Buttons
    [['profile-cancel-image', imageForm], ['profile-cancel-name', nameForm], ['profile-cancel-password', passwordForm]].forEach(([btnId, form]) => {
        const btn = $(btnId);
        if (btn && form) {
            btn.onclick = () => {
                form.classList.add('hidden');
                $('profile-choice').classList.remove('hidden');
            };
        }
    });

    // Live-Bildvorschau und Fehleranzeige
    if (imageUrlInput && imagePreview && imageError) {
        imageUrlInput.addEventListener('input', () => {
            const url = imageUrlInput.value.trim();
            if (!url) {
                imagePreview.src = '';
                imagePreview.classList.add('hidden');
                imageError.textContent = '';
                return;
            }
            imagePreview.src = url;
            imagePreview.classList.remove('hidden');
            imageError.textContent = '';
        });
        imagePreview.onerror = () => {
            imagePreview.classList.add('hidden');
            imageError.textContent = 'Bild konnte nicht geladen werden.';
        };
        imagePreview.onload = () => {
            imageError.textContent = '';
            imagePreview.classList.remove('hidden');
        };
    }

    // Profilbild speichern
    if (imageForm) {
        imageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const imageUrl = imageUrlInput.value.trim();
            if (!imageUrl) {
                imageError.textContent = 'Bitte gib eine Bild-URL ein.';
                return;
            }
            try {
                const res = await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ profile_image_url: imageUrl }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');
                imageMessage.textContent = 'Profilbild gespeichert!';
                imageMessage.className = 'text-green-600';
                setProfileBtnImage(imageUrl);
                try {
                    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                    profile.image = imageUrl;
                    localStorage.setItem('user_profile', JSON.stringify(profile));
                } catch { }
                setTimeout(() => { imageMessage.textContent = ''; }, 2000);
            } catch (err) {
                imageMessage.textContent = err.message || 'Fehler beim Speichern';
                imageMessage.className = 'text-red-500';
            }
        });
    }

    // Name speichern
    if (nameForm) {
        nameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            if (!username) {
                nameMessage.textContent = 'Bitte gib einen Benutzernamen ein.';
                nameMessage.className = 'text-red-500';
                return;
            }
            try {
                const res = await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name: username }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');
                nameMessage.textContent = 'Name gespeichert!';
                nameMessage.className = 'text-green-600';
                try {
                    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                    profile.name = username;
                    localStorage.setItem('user_profile', JSON.stringify(profile));
                } catch { }
                setTimeout(() => { nameMessage.textContent = ''; }, 2000);
            } catch (err) {
                nameMessage.textContent = err.message || 'Fehler beim Speichern';
                nameMessage.className = 'text-red-500';
            }
        });
    }

    // Passwort speichern
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = passwordInput.value;
            const repeat = passwordRepeatInput.value;
            if (!password) {
                passwordMessage.textContent = 'Bitte gib ein Passwort ein.';
                passwordMessage.className = 'text-red-500';
                return;
            }
            if (password !== repeat) {
                passwordMessage.textContent = 'Passwörter stimmen nicht überein.';
                passwordMessage.className = 'text-red-500';
                return;
            }
            try {
                const res = await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');
                passwordMessage.textContent = 'Passwort gespeichert!';
                passwordMessage.className = 'text-green-600';
                passwordInput.value = '';
                passwordRepeatInput.value = '';
                setTimeout(() => { passwordMessage.textContent = ''; }, 2000);
            } catch (err) {
                passwordMessage.textContent = err.message || 'Fehler beim Speichern';
                passwordMessage.className = 'text-red-500';
            }
        });
    }
});
