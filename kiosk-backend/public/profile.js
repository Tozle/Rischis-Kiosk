// Profileinstellungen-Logik für dashboard.html
window.addEventListener('DOMContentLoaded', async () => {
    // Zentrale Meldung für Auswahl
    let profileMessage = document.getElementById('profile-message');
    if (!profileMessage) {
        profileMessage = document.createElement('div');
        profileMessage.id = 'profile-message';
        profileMessage.className = 'mb-2 text-center text-sm';
        // Füge die Meldung direkt nach dem Auswahlbereich ein
        const choice = document.getElementById('profile-choice');
        if (choice && choice.parentNode) {
            choice.parentNode.insertBefore(profileMessage, choice.nextSibling);
        }
    }
    // Button und Modal referenzieren
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const profileClose = document.getElementById('profile-close');
    // Bild
    const imageForm = document.getElementById('profile-image-form');
    const profileForm = document.getElementById('profile-form');
    const imageUrlInput = document.getElementById('profile-image-url');
    const imagePreview = document.getElementById('profile-image-preview');
    const imageError = document.getElementById('profile-image-error');
    const imageMessage = document.getElementById('profile-image-message');
    // Name
    const nameForm = document.getElementById('profile-name-form');
    const usernameInput = document.getElementById('profile-username');
    const nameMessage = document.getElementById('profile-name-message');
    // Passwort
    const passwordForm = document.getElementById('profile-password-form');
    const passwordInput = document.getElementById('profile-password');
    const passwordRepeatInput = document.getElementById('profile-password-repeat');
    const passwordMessage = document.getElementById('profile-password-message');

    if (!profileBtn) {
        console.warn('Profileinstellungen-Button (profile-btn) nicht im DOM gefunden!');
        return;
    }
    if (!profileModal) {
        console.warn('Profileinstellungen-Modal (profile-modal) nicht im DOM gefunden!');
        return;
    }

    // Profileinstellungen-Modal standardmäßig ausblenden
    if (profileModal) profileModal.style.display = 'none';

    // Profilbild und Userdaten setzen, wenn eingeloggt
    let userData = null;
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data?.loggedIn) {
            userData = data.user;
            if (profileBtn) {
                // Profilbild als Button anzeigen, falls vorhanden
                profileBtn.innerHTML = '';
                const imgUrl = data.user?.profile_image_url;
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
                // Speichere Userdaten für Games-Seite
                try {
                    localStorage.setItem('user_profile', JSON.stringify({
                        name: data.user?.name || '',
                        image: data.user?.profile_image_url || ''
                    }));
                } catch { }
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
    } catch { }

    // Modal-Öffnen-Listener immer setzen
    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', async () => {
            // Prüfe Login-Status live
            let user = userData;
            if (!user) {
                try {
                    const res = await fetch('/api/auth/me', { credentials: 'include' });
                    const data = await res.json();
                    if (data?.loggedIn) user = data.user;
                } catch {}
            }
            if (!user) {
                alert('Bitte zuerst einloggen, um die Profileinstellungen zu öffnen.');
                return;
            }
            // Hole aktuellen Usernamen, Profilbild und Guthaben
            if (usernameInput) usernameInput.value = user?.name || '';
            if (imageUrlInput) imageUrlInput.value = user?.profile_image_url || '';
            // Guthaben anzeigen
            const balanceElem = document.getElementById('profile-balance');
            if (balanceElem) {
                let balance = user?.balance;
                if (typeof balance === 'number') {
                    balanceElem.textContent = balance.toFixed(2).replace('.', ',') + ' €';
                    if (balance < 0) {
                        balanceElem.classList.remove('text-green-700');
                        balanceElem.classList.add('text-red-600');
                    } else {
                        balanceElem.classList.remove('text-red-600');
                        balanceElem.classList.add('text-green-700');
                    }
                } else {
                    balanceElem.textContent = '–';
                    balanceElem.classList.remove('text-red-600', 'text-green-700');
                }
            }
            // Nur Auswahl anzeigen, alle Formulare ausblenden
            const choice = document.getElementById('profile-choice');
            const imageForm = document.getElementById('profile-image-form');
            const nameForm = document.getElementById('profile-name-form');
            const passwordForm = document.getElementById('profile-password-form');
            if (choice) choice.classList.remove('hidden');
            if (imageForm) imageForm.classList.add('hidden');
            if (nameForm) nameForm.classList.add('hidden');
            if (passwordForm) passwordForm.classList.add('hidden');
            if (profileMessage) profileMessage.textContent = '';
            if (profileModal) profileModal.classList.remove('hidden');

            // Auswahl-Buttons aktivieren
            const btnImage = document.getElementById('profile-choice-image');
            const btnName = document.getElementById('profile-choice-name');
            const btnPassword = document.getElementById('profile-choice-password');
            if (btnImage) btnImage.onclick = () => {
                if (choice) choice.classList.add('hidden');
                if (imageForm) imageForm.classList.remove('hidden');
                if (nameForm) nameForm.classList.add('hidden');
                if (passwordForm) passwordForm.classList.add('hidden');
                if (profileMessage) profileMessage.textContent = '';
            };
            if (btnName) btnName.onclick = () => {
                if (choice) choice.classList.add('hidden');
                if (imageForm) imageForm.classList.add('hidden');
                if (nameForm) nameForm.classList.remove('hidden');
                if (passwordForm) passwordForm.classList.add('hidden');
                if (profileMessage) profileMessage.textContent = '';
            };
            if (btnPassword) btnPassword.onclick = () => {
                if (choice) choice.classList.add('hidden');
                if (imageForm) imageForm.classList.add('hidden');
                if (nameForm) nameForm.classList.add('hidden');
                if (passwordForm) passwordForm.classList.remove('hidden');
                if (profileMessage) profileMessage.textContent = '';
            };
        });
        // Auswahl-Buttons
        const editImageBtn = document.getElementById('profile-edit-image-btn');
        const editNameBtn = document.getElementById('profile-edit-name-btn');
        const editPasswordBtn = document.getElementById('profile-edit-password-btn');
        const choice = document.getElementById('profile-choice');
        const imageForm = document.getElementById('profile-image-form');
        const nameForm = document.getElementById('profile-name-form');
        const passwordForm = document.getElementById('profile-password-form');
        if (editImageBtn && choice && imageForm) {
            editImageBtn.onclick = () => {
                choice.classList.add('hidden');
                imageForm.classList.remove('hidden');
            };
        }
        if (editNameBtn && choice && nameForm) {
            editNameBtn.onclick = () => {
                choice.classList.add('hidden');
                nameForm.classList.remove('hidden');
            };
        }
        if (editPasswordBtn && choice && passwordForm) {
            editPasswordBtn.onclick = () => {
                choice.classList.add('hidden');
                passwordForm.classList.remove('hidden');
            };
        }
        // Abbrechen-Buttons
        const cancelImageBtn = document.getElementById('profile-cancel-image');
        const cancelNameBtn = document.getElementById('profile-cancel-name');
        const cancelPasswordBtn = document.getElementById('profile-cancel-password');
        if (cancelImageBtn && imageForm && choice) {
            cancelImageBtn.onclick = () => {
                imageForm.classList.add('hidden');
                choice.classList.remove('hidden');
            };
        }
        if (cancelNameBtn && nameForm && choice) {
            cancelNameBtn.onclick = () => {
                nameForm.classList.add('hidden');
                choice.classList.remove('hidden');
            };
        }
        if (cancelPasswordBtn && passwordForm && choice) {
            cancelPasswordBtn.onclick = () => {
                passwordForm.classList.add('hidden');
                choice.classList.remove('hidden');
            };
        }
    }

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
                if (profileBtn) {
                    profileBtn.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = 'Profilbild';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '9999px';
                    profileBtn.appendChild(img);
                }
                // Speichere neues Bild im LocalStorage für Games-Seite
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
                // Speichere neuen Namen im LocalStorage für Games-Seite
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
                // Feedback, was geändert wurde
                let changed = [];
                if (data.changed) {
                    if (data.changed.name) changed.push('Name');
                    if (data.changed.profile_image_url) changed.push('Profilbild');
                    if (data.changed.password) changed.push('Passwort');
                }
                profileMessage.textContent = changed.length
                    ? `Geändert: ${changed.join(', ')}`
                    : 'Profil erfolgreich gespeichert!';
                profileMessage.className = 'text-green-600';
                setTimeout(() => profileModal.classList.add('hidden'), 1500);
                // Profilbild-Button ggf. aktualisieren
                if (profileBtn && changed.includes('Profilbild')) {
                    if (imageUrl) {
                        profileBtn.innerHTML = `<img src="${imageUrl}" alt="Profilbild" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`;
                    } else {
                        profileBtn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' class='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>`;
                    }
                    // Speichere neues Bild im LocalStorage für Games-Seite
                    try {
                        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                        profile.image = imageUrl;
                        localStorage.setItem('user_profile', JSON.stringify(profile));
                    } catch { }
                }
            } catch (err) {
                profileMessage.textContent = err.message || 'Fehler beim Speichern';
                profileMessage.className = 'text-red-500';
            }
        });
    }
});
