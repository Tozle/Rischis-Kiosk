// Tab-Logik für Adminbereich
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('#admin-tabs button').forEach(btn => btn.classList.remove('bg-cyan-600', 'text-white'));
  const section = document.getElementById('section-' + tab);
  if (section) section.style.display = '';
  const btn = document.querySelector(`#admin-tabs [data-tab="${tab}"]`);
  if (btn) btn.classList.add('bg-cyan-600', 'text-white');
}

window.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  // Tabs initialisieren
  document.querySelectorAll('#admin-tabs button').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
  });
  // Standard: Produkte anzeigen
  showTab('products');
});
// Produktbild-Vorschau und Upload-Handling

// Bild-URL Feld
const productImageUrlInput = document.getElementById('product-image-url');
// Bildvorschau für Bild-URL
let productImageUrlPreview = null;
if (productImageUrlInput) {
  productImageUrlPreview = document.createElement('img');
  productImageUrlPreview.alt = 'Vorschau';
  productImageUrlPreview.className = 'mt-2 max-h-32 rounded shadow hidden';
  productImageUrlInput.parentNode.insertBefore(productImageUrlPreview, productImageUrlInput.nextSibling);
  productImageUrlInput.addEventListener('input', () => {
    const url = productImageUrlInput.value.trim();
    if (url && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) {
      productImageUrlPreview.src = url;
      productImageUrlPreview.classList.remove('hidden');
    } else {
      productImageUrlPreview.src = '';
      productImageUrlPreview.classList.add('hidden');
    }
  });
}
// --- Käufe-Filter & Export ---
let allPurchasesCache = [];

function filterAndRenderPurchases() {
  const search = document.getElementById('purchase-search')?.value?.toLowerCase() || '';
  const filtered = allPurchasesCache.filter(e => {
    if (!search) return true;
    const date = new Date(e.created_at).toLocaleDateString('de-DE');
    const price = e.price.toFixed(2).replace('.', ',');
    return (
      e.user_name.toLowerCase().includes(search) ||
      e.product_name.toLowerCase().includes(search) ||
      date.includes(search) ||
      price.includes(search)
    );
  });
  renderPurchaseList(filtered);
}

function renderPurchaseList(purchases) {
  const list = document.getElementById('purchase-history');
  list.innerHTML = '';
  // Kopfzeile
  const header = document.createElement('li');
  header.className = 'grid grid-cols-4 gap-2 font-bold text-green-800 dark:text-green-200 mb-1 px-2';
  header.innerHTML = `
    <span>Datum</span>
    <span>Name</span>
    <span>Menge & Produkt</span>
    <span>Preis</span>
  `;
  list.appendChild(header);
  purchases.forEach(e => {
    const li = document.createElement('li');
    li.className = 'grid grid-cols-4 gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm mb-2 items-center';
    li.innerHTML = `
      <span class="text-xs text-gray-500 dark:text-gray-400">${formatDateTime(e.created_at)}</span>
      <span class="font-semibold">${e.user_name}</span>
      <span>${e.quantity || 1}x ${e.product_name}</span>
      <span class="font-bold">${e.price.toFixed(2)} €</span>
    `;
    list.appendChild(li);
  });
}

function exportPurchasesCSV() {
  const search = document.getElementById('purchase-search')?.value?.toLowerCase() || '';
  const filtered = allPurchasesCache.filter(e =>
    e.user_name.toLowerCase().includes(search) ||
    e.product_name.toLowerCase().includes(search)
  );
  const csv = ['Datum,Uhrzeit,Nutzer,Produkt,Menge,Preis'];
  filtered.forEach(e => {
    const d = new Date(e.created_at);
    const date = d.toLocaleDateString('de-DE');
    const time = d.toLocaleTimeString('de-DE');
    csv.push(`"${date}","${time}","${e.user_name.replace(/"/g, '""')}","${e.product_name.replace(/"/g, '""')}",${e.quantity || 1},${e.price.toFixed(2)}`);
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kaeufe.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// --- Benutzer-Filter & Export ---
let allUsersCache = [];

function filterAndRenderUsers() {
  const search = document.getElementById('user-search')?.value?.toLowerCase() || '';
  const filtered = allUsersCache.filter(u =>
    u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );
  renderUserList(filtered);
}

function renderUserList(users) {
  const list = document.getElementById('user-manage-list');
  list.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm mb-2';
    li.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
        <span class="font-semibold text-green-900 dark:text-green-200">${u.name}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">${u.email}</span>
      </div>
      <div class="flex gap-2 mt-2 sm:mt-0">
        <button class="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1 text-xs" title="Bearbeiten" onclick="editUser('${u.id}', '${u.name}')">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M11 5h2m-1 0v14m-7-7h14' /></svg>
          Bearbeiten
        </button>
        <button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center gap-1 text-xs" title="Löschen" onclick="deleteUser('${u.id}')">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12' /></svg>
          Löschen
        </button>
      </div>
    `;
    list.appendChild(li);
  });
  // Undo-fähige Benutzerlöschung
  let lastDeletedUser = null;
  async function deleteUser(id) {
    if (!(await confirmAction('Benutzer wirklich löschen? Alle Käufe bleiben erhalten.'))) return;
    showLoader(true);
    // Hole Userdaten vor dem Löschen
    const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
    const users = await res.json();
    const user = users.find(u => u.id === id);
    lastDeletedUser = user ? { ...user } : null;
    const token = await getCsrfToken();
    await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'x-csrf-token': token },
    });
    showLoader(false);
    showToast('Benutzer gelöscht.', 'success', 5000, async () => {
      if (!lastDeletedUser) return;
      showLoader(true);
      const token2 = await getCsrfToken();
      await fetch(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(lastDeletedUser)
      });
      showLoader(false);
      showToast('Löschung rückgängig gemacht!', 'success');
      loadUserPasswords();
      lastDeletedUser = null;
    });
    loadUserPasswords();
  }
  window.deleteUser = deleteUser;
}

function exportUsersCSV() {
  const search = document.getElementById('user-search')?.value?.toLowerCase() || '';
  const filtered = allUsersCache.filter(u =>
    u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );
  const csv = ['Name,Email'];
  filtered.forEach(u => {
    csv.push(`"${u.name.replace(/"/g, '""')}","${u.email.replace(/"/g, '""')}"`);
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'benutzer.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// Toast-Benachrichtigung
function showToast(msg, type = 'success', duration = 3000, undoCallback = null) {
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
}

// Ladeanimation
function showLoader(show = true) {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.toggle('hidden', !show);
}

// Bestätigungsdialog
async function confirmAction(msg) {
  return new Promise((resolve) => {
    if (window.confirm(msg)) resolve(true); else resolve(false);
  });
}
// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;

// Aktuell eingeloggter Benutzer
let currentUserId = null;

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

// Darkmode
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

function toggleSection(id) {
  const container = document.getElementById(`${id}-container`);
  container?.classList.toggle('hidden');
  const arrow = document.querySelector(`#toggle-${id} .arrow`);
  if (container && arrow) {
    arrow.textContent = container.classList.contains('hidden') ? '▼' : '▲';
  }
}

// Hilfsfunktion für Datum
function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) + ' ' +
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Berlin' });
}

// Eingeloggten Benutzer laden
async function loadCurrentUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      currentUserId = user.id;
    }
  } catch (err) {
    console.error('Fehler beim Laden des Benutzers', err);
  }
}

// -------- Produkte --------
async function loadProducts() {
  const category = document.getElementById('category-filter')?.value || 'all';
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, { credentials: 'include' });
  const data = await res.json();
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  data.filter(p => category === 'all' || p.category === category).forEach(p => {
    const li = document.createElement('li');
    li.className = 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4';
    const hasImage = p.image_url && p.image_url.trim() !== '';
    li.innerHTML = `
      <div class="flex items-center gap-4 flex-1">
        ${hasImage ? `<img src="${p.image_url}" alt="${p.name}" class="w-16 h-16 object-contain rounded shadow border border-gray-200 dark:border-gray-700 bg-white" loading="lazy">` : ''}
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-base font-semibold">${p.name}</span>
            <span class="inline-block px-2 py-0.5 rounded text-xs font-bold ${p.available ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200' : 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200'}">
              ${p.available ? 'Verfügbar' : 'Versteckt'}
            </span>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            <span>Preis: <strong>${p.price.toFixed(2)} €</strong></span> –
            <span>Bestand: <strong>${p.stock}</strong></span> –
            <span>Kategorie: <strong>${p.category || '-'}</strong></span>
          </div>
        </div>
      </div>
      <div class="flex flex-row gap-2 mt-3 sm:mt-0 sm:ml-4">
        <button onclick="toggleAvailability('${p.id}', ${p.available})" class="bg-yellow-500 text-white text-xs px-2 py-1 rounded shadow hover:bg-yellow-600 focus:outline-none flex items-center gap-1" title="${p.available ? 'Verstecken' : 'Anzeigen'}">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 19l-7-7 7-7' /></svg>
          ${p.available ? 'Verstecken' : 'Anzeigen'}
        </button>
        <button onclick="editProduct('${p.id}')" class="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-blue-700 focus:outline-none flex items-center gap-1" title="Bearbeiten">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M11 5h2m-1 0v14m-7-7h14' /></svg>
          Bearbeiten
        </button>
        <button onclick="deleteProduct('${p.id}')" class="bg-red-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-700 focus:outline-none flex items-center gap-1" title="Löschen">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12' /></svg>
          Löschen
        </button>
      </div>
    `;
    list.appendChild(li);
  });
}

document.getElementById('category-filter')?.addEventListener('change', loadProducts);

async function addProduct(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value.replace(',', '.'));
  const purchase_price = parseFloat(document.getElementById('product-purchase').value.replace(',', '.'));
  const stock = parseInt(document.getElementById('product-stock').value);
  const category = document.getElementById('product-category').value;
  const msgEl = document.getElementById('product-result');
  // Validierung
  // Bild-URL validieren
  let image_url = productImageUrlInput?.value?.trim() || '';
  if (image_url && !/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(image_url)) {
    msgEl.textContent = 'Bitte eine gültige Bild-URL angeben (jpg, png, webp, gif, svg)!';
    msgEl.classList.add('text-red-600');
    if (btn) btn.disabled = false;
    return;
  }
  if (!name || isNaN(price) || isNaN(purchase_price) || isNaN(stock) || !category) {
    msgEl.textContent = 'Bitte alle Felder korrekt ausfüllen!';
    msgEl.classList.add('text-red-600');
    if (btn) btn.disabled = false;
    return;
  }
  const token = await getCsrfToken();
  // image_url ist oben schon gesetzt
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    credentials: 'include',
    body: JSON.stringify({ name, price, purchase_price, stock, category, created_by: currentUserId, image_url })
  });
  const result = await res.json();
  msgEl.textContent = res.ok ? 'Produkt gespeichert!' : `Fehler: ${result.error}`;
  msgEl.classList.toggle('text-red-600', !res.ok);
  msgEl.classList.toggle('text-green-700', res.ok);
  if (res.ok) {
    e.target.reset();
    if (productImageUrlPreview) {
      productImageUrlPreview.src = '';
      productImageUrlPreview.classList.add('hidden');
    }
    loadStats();
    loadProducts();
    // Nach Speichern zur Produktliste wechseln
    document.querySelector('[data-tab="products"]').click();
  }
  if (btn) btn.disabled = false;
  setTimeout(() => {
    msgEl.textContent = '';
    msgEl.classList.remove('text-red-600', 'text-green-700');
  }, 3000);
}

document.getElementById('add-product')?.addEventListener('submit', addProduct);

async function editProduct(id) {
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, { credentials: 'include' });
  const products = await res.json();
  const p = products.find(x => x.id === id);
  if (!p) return;
  let lastEditedProduct = { ...p };
  // Dialog für Bearbeitung inkl. Bild-URL
  let editDialog = document.createElement('div');
  editDialog.innerHTML = `
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md relative">
        <button id="close-edit-dialog" class="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-xl">&times;</button>
        <h2 class="text-lg font-bold mb-4">Produkt bearbeiten</h2>
        <form id="edit-product-form" class="space-y-3">
          <input type="text" id="edit-product-name" value="${p.name}" required class="w-full p-2 rounded border" placeholder="Name" />
          <input type="number" step="0.01" id="edit-product-price" value="${p.price}" required class="w-full p-2 rounded border" placeholder="Verkaufspreis" />
          <input type="number" id="edit-product-stock" value="${p.stock}" required class="w-full p-2 rounded border" placeholder="Bestand" />
          <div>
            <label class="block text-sm mb-1">Bild-URL (optional)</label>
            <input type="url" id="edit-product-image-url" value="${p.image_url || ''}" class="block w-full text-sm" placeholder="Bild-URL" />
            <img id="edit-product-image-preview" src="${p.image_url || ''}" alt="Vorschau" class="mt-2 max-h-32 rounded shadow${p.image_url ? '' : ' hidden'}" />
          </div>
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(editDialog);
  // Dialog schließen
  editDialog.querySelector('#close-edit-dialog').onclick = () => editDialog.remove();
  // Fokus auf erstes Feld
  setTimeout(() => {
    const firstInput = editDialog.querySelector('input,select,button');
    if (firstInput) firstInput.focus();
  }, 50);
  // ESC schließt Dialog
  editDialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      editDialog.remove();
    }
  });
  // Fokus-Falle für Barrierefreiheit
  editDialog.tabIndex = -1;
  editDialog.focus();
  // Bild-URL Vorschau
  const editImageUrlInput = editDialog.querySelector('#edit-product-image-url');
  const editImagePreview = editDialog.querySelector('#edit-product-image-preview');
  editImageUrlInput.addEventListener('input', () => {
    const url = editImageUrlInput.value.trim();
    if (url && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) {
      editImagePreview.src = url;
      editImagePreview.classList.remove('hidden');
    } else {
      editImagePreview.src = '';
      editImagePreview.classList.add('hidden');
    }
  });
  // Formular absenden
  editDialog.querySelector('#edit-product-form').onsubmit = async (ev) => {
    ev.preventDefault();
    const newName = editDialog.querySelector('#edit-product-name').value;
    const newPrice = editDialog.querySelector('#edit-product-price').value;
    const newStock = editDialog.querySelector('#edit-product-stock').value;
    const image_url = editImageUrlInput.value.trim();
    const token = await getCsrfToken();
    await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include',
      body: JSON.stringify({ name: newName, price: parseFloat(newPrice), stock: parseInt(newStock), image_url })
    });
    editDialog.remove();
    showToast('Produkt bearbeitet.', 'success', 5000, async () => {
      showLoader(true);
      const token2 = await getCsrfToken();
      await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token2,
        },
        credentials: 'include',
        body: JSON.stringify(lastEditedProduct)
      });
      showLoader(false);
      showToast('Bearbeitung rückgängig gemacht!', 'success');
      loadProducts();
      loadStats();
    });
    loadProducts();
    loadStats();
  };
}

async function toggleAvailability(id, current) {
  const token2 = await getCsrfToken();
  await fetch(`${BACKEND_URL}/api/admin/products/${id}/available`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token2,
    },
    credentials: 'include',
    body: JSON.stringify({ available: !current })
  });
  loadProducts();
}

async function deleteProduct(id) {
  if (!(await confirmAction('Produkt löschen (Käufe bleiben erhalten)?'))) return;
  showLoader(true);
  const token3 = await getCsrfToken();
  // Produktdaten vor dem Löschen holen
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, { credentials: 'include' });
  const products = await res.json();
  const prod = products.find(x => x.id === id);
  let lastDeletedProduct = prod ? { ...prod } : null;
  await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'x-csrf-token': token3 },
  });
  showLoader(false);
  showToast('Produkt gelöscht.', 'success', 5000, async () => {
    if (!lastDeletedProduct) return;
    showLoader(true);
    const token = await getCsrfToken();
    await fetch(`${BACKEND_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include',
      body: JSON.stringify(lastDeletedProduct)
    });
    showLoader(false);
    showToast('Löschung rückgängig gemacht!', 'success');
    loadProducts();
    loadStats();
    loadPurchases(true);
  });
  loadProducts();
  loadStats();
  loadPurchases(true);
}

// ---------- Statistik ----------
async function loadStats() {
  const res = await fetch(`${BACKEND_URL}/api/admin/stats`, { credentials: 'include' });
  if (!res.ok) return;
  const { users, totalBalance, shopValue, totalRevenue, totalCost, profit } = await res.json();
  document.getElementById('stats').innerHTML = `
    <p class="mt-4 text-sm"><strong>Produkte im Shop:</strong> ${users.length}</p>
    <p class="text-sm"><strong>Shop-Warenwert:</strong> ${shopValue.toFixed(2)} €</p>
    <hr class="my-3" />
    <p class="text-sm"><strong>Verkaufserlöse:</strong> ${totalRevenue.toFixed(2)} €</p>
    <p class="text-sm"><strong>Einkaufskosten:</strong> ${totalCost.toFixed(2)} €</p>
    <p class="text-sm"><strong>Gewinn / Verlust:</strong> <span class="${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${profit.toFixed(2)} €</span></p>
    <hr class="my-3" />
    <p class="text-sm"><strong>Gesamtsaldo aller Nutzer:</strong> <span class="${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${totalBalance.toFixed(2)} €</span></p>`;
}


// ---------- Käufe ----------
let purchasesVisible = false;
let purchaseOffset = 0;
const purchaseLimit = 20;

function togglePurchases() {
  const c = document.getElementById('purchase-container');
  purchasesVisible = !purchasesVisible;
  if (purchasesVisible) {
    c.classList.remove('hidden');
    purchaseOffset = 0;
    loadPurchases(true);
    const arrow = document.querySelector('#toggle-purchases .arrow');
    if (arrow) arrow.textContent = '▲';
  } else {
    c.classList.add('hidden');
    document.getElementById('purchase-history').innerHTML = '';
    const arrow = document.querySelector('#toggle-purchases .arrow');
    if (arrow) arrow.textContent = '▼';
  }
}

async function loadPurchases(initial = false) {
  const res = await fetch(`${BACKEND_URL}/api/admin/purchases?offset=${purchaseOffset}&limit=${purchaseLimit}`, { credentials: 'include' });
  const data = await res.json();
  if (initial) {
    allPurchasesCache = data;
    filterAndRenderPurchases();
  } else {
    allPurchasesCache = allPurchasesCache.concat(data);
    filterAndRenderPurchases();
  }
  purchaseOffset += purchaseLimit;
  // Event-Listener für Käufe-Suche (nur Suche, Export-Button in Initialisierung)
  document.getElementById('purchase-search')?.addEventListener('input', filterAndRenderPurchases);
}

function loadMorePurchases() { loadPurchases(false); }

// ---------- Benutzer & Guthaben ----------
async function loadUserPasswords() {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
  const data = await res.json();
  allUsersCache = data;
  filterAndRenderUsers();
  // Event-Listener für Suche und Export
  window.addEventListener('DOMContentLoaded', () => {
    // Darkmode-Button
    const darkBtn = document.getElementById('darkmode-toggle');
    if (darkBtn) {
      darkBtn.onclick = () => {
        toggleDarkMode();
        // Icon wechseln
        const icon = document.getElementById('darkmode-icon-path');
        if (document.documentElement.classList.contains('dark')) {
          icon.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z');
        } else {
          icon.setAttribute('d', 'M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z');
        }
      };
    }
    document.getElementById('user-search')?.addEventListener('input', filterAndRenderUsers);
    document.getElementById('export-users')?.addEventListener('click', exportUsersCSV);
  });
}

async function editUser(id, currentName) {
  let lastUserData = null;
  // Hole aktuelle Userdaten
  const resUser = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
  const users = await resUser.json();
  const user = users.find(u => u.id === id);
  if (user) lastUserData = { ...user };
  const newName = prompt('Neuer Name:', currentName);
  if (newName && newName.trim() !== '') {
    showLoader(true);
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include',
      body: JSON.stringify({ name: newName.trim() })
    });
    showLoader(false);
    if (!res.ok) {
      showToast('Fehler beim Speichern des Namens', 'error');
      return;
    }
    showToast('Benutzername geändert.', 'success', 5000, async () => {
      if (!lastUserData) return;
      showLoader(true);
      const token2 = await getCsrfToken();
      await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token2,
        },
        credentials: 'include',
        body: JSON.stringify({ name: lastUserData.name })
      });
      showLoader(false);
      showToast('Namensänderung rückgängig gemacht!', 'success');
      loadUserPasswords();
    });
  }
  const newPw = prompt('Neues Passwort (mind. 6 Zeichen, leer lassen zum Überspringen):');
  if (newPw) {
    if (newPw.length < 6) return showToast('Passwort zu kurz.', 'error');
    showLoader(true);
    const tokenPw = await getCsrfToken();
    const resPw = await fetch(`${BACKEND_URL}/api/admin/users/${id}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': tokenPw,
      },
      credentials: 'include',
      body: JSON.stringify({ password: newPw })
    });
    showLoader(false);
    if (!resPw.ok) {
      showToast('Fehler beim Ändern des Passworts', 'error');
      return;
    }
    // Undo-Button für Passwortänderung (nur Demo, da altes Passwort nicht lesbar)
    showToast('Passwort geändert.', 'success', 5000, async () => {
      alert('Das alte Passwort kann aus Sicherheitsgründen nicht wiederhergestellt werden.');
    });
  } else {
    showToast('Benutzerdaten gespeichert!', 'success');
  }
  loadUserPasswords();
}

async function loadUserBalances() {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
  const data = await res.json();
  document.getElementById('balance-control-list').innerHTML = data.map(u => {
    const cls = u.balance < 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400 font-bold';
    return `<li class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm mb-2">
      <span class="flex-1 font-semibold">${u.name}: <span class="${cls}">${u.balance.toFixed(2)} €</span></span>
      <div class="flex gap-2 mt-2 sm:mt-0">
        <input type="number" id="bal-${u.id}" class="w-20 border px-2 py-1 rounded" step="0.01" />
        <button onclick="updateBalance('${u.id}', 'add')" class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center gap-1 text-xs" title="Guthaben erhöhen">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4' /></svg>
        </button>
        <button onclick="updateBalance('${u.id}', 'subtract')" class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center gap-1 text-xs" title="Guthaben verringern">
          <svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 12H4' /></svg>
        </button>
      </div>
    </li>`;
  }).join('');
}

async function updateBalance(id, action) {
  const val = parseFloat(document.getElementById('bal-' + id).value);
  if (isNaN(val)) return showToast('Ungültiger Betrag.', 'error');
  showLoader(true);
  const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}`, { credentials: 'include' });
  const user = await res.json();
  let newBalance = user.balance;
  if (action === 'add') newBalance += val; else newBalance -= val;
  const token = await getCsrfToken();
  await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    credentials: 'include',
    body: JSON.stringify({ balance: newBalance })
  });
  showLoader(false);
  showToast('Guthaben aktualisiert.', 'success');
  loadUserBalances();
  loadStats();
}

// -------- Produkt für Nutzer kaufen --------
async function loadBuyUsers() {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
  const data = await res.json();
  const select = document.getElementById('buy-user');
  if (!select) return;
  select.innerHTML = data.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

let allBuyProductsCache = [];
function renderBuyProductList(products) {
  const list = document.getElementById('buy-product-list');
  if (!list) return;
  list.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center';
    card.innerHTML = `
      ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" class="w-20 h-20 object-contain mb-2 rounded shadow">` : ''}
      <div class="font-semibold text-center mb-1">${p.name}</div>
      <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">${p.price.toFixed(2)} €</div>
      <div class="text-xs text-gray-500 mb-2">Bestand: ${p.stock}</div>
      <div class="flex gap-1 items-center mb-2">
        <input type="number" min="1" max="${p.stock}" value="1" class="buy-qty-input p-1 border rounded w-14 text-center" aria-label="Menge" />
      </div>
      <button class="buy-for-user-btn btn-main bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 w-full" data-product-id="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Kaufen</button>
    `;
    list.appendChild(card);
  });
}

async function loadBuyProducts() {
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, { credentials: 'include' });
  const data = await res.json();
  allBuyProductsCache = data.filter(p => p.available && p.stock > 0);
  renderBuyProductList(allBuyProductsCache);
}

function filterAndRenderBuyProducts() {
  const search = document.getElementById('buy-product-search')?.value?.toLowerCase() || '';
  const filtered = allBuyProductsCache.filter(p =>
    p.name.toLowerCase().includes(search) ||
    (p.category && p.category.toLowerCase().includes(search))
  );
  renderBuyProductList(filtered);
}

async function buyForUser(productId, qty) {
  const userId = document.getElementById('buy-user')?.value;
  if (!userId || !productId || isNaN(qty) || qty <= 0) return;
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/admin/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    credentials: 'include',
    body: JSON.stringify({ user_id: userId, product_id: productId, quantity: qty })
  });
  const result = await res.json();
  const msgEl = document.getElementById('buy-for-user-result');
  msgEl.textContent = res.ok ? 'Kauf durchgeführt' : result.error || 'Fehler';
  if (res.ok) {
    loadStats();
    loadProducts();
    loadUserBalances();
    loadBuyProducts();
  }
}

// ---------- Initialisierung ----------
window.addEventListener('DOMContentLoaded', () => {
  loadCurrentUser();
  loadStats();
  loadProducts();
  loadPurchases(true);
  loadUserPasswords();
  loadUserBalances();
  loadBuyUsers();
  loadBuyProducts();
  document.getElementById('export-purchases')?.addEventListener('click', exportPurchasesCSV);
  // Buy for user: Produkt-Suche
  document.getElementById('buy-product-search')?.addEventListener('input', filterAndRenderBuyProducts);
  // Buy for user: Kaufen-Button-Logik (Event Delegation)
  document.getElementById('buy-product-list')?.addEventListener('click', function (e) {
    if (e.target.classList.contains('buy-for-user-btn')) {
      const card = e.target.closest('div');
      const productId = e.target.getAttribute('data-product-id');
      const qtyInput = card.querySelector('.buy-qty-input');
      const qty = parseInt(qtyInput.value || '1');
      buyForUser(productId, qty);
    }
  });
  if (typeof startSessionCheck === 'function') startSessionCheck();
});

// FAQ Overlay-Logik, Darkmode, Tabs, Logout, Session-Timeout
window.addEventListener('DOMContentLoaded', () => {
  // FAQ Overlay
  const faqBtn = document.getElementById('faq-btn');
  const faqOverlay = document.getElementById('faq-overlay');
  const faqClose = document.getElementById('faq-close');
  if (faqBtn && faqOverlay && faqClose) {
    faqBtn.addEventListener('click', () => { faqOverlay.classList.remove('hidden'); faqClose.focus(); });
    faqClose.addEventListener('click', () => { faqOverlay.classList.add('hidden'); faqBtn.focus(); });
    faqOverlay.addEventListener('click', (e) => { if (e.target === faqOverlay) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
    document.addEventListener('keydown', (e) => { if (!faqOverlay.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
  }
  // Darkmode
  const darkModeBtn = document.getElementById('darkModeBtn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    });
  }
  if (localStorage.getItem('darkMode') === null) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  } else if (localStorage.getItem('darkMode') !== 'false') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  // Tab-Navigation
  const tabButtons = document.querySelectorAll('#admin-tabs button[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
  function showTab(tab) {
    tabContents.forEach(function (c) {
      if (c.id === 'section-' + tab) {
        c.style.display = '';
      } else {
        c.style.display = 'none';
      }
    });
    tabButtons.forEach(function (b) {
      b.classList.toggle('ring-2', b.dataset.tab === tab);
    });
  }
  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showTab(btn.dataset.tab);
    });
  });
  showTab('products');
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch('/api/logout', { method: 'POST', credentials: 'include' })
        .finally(() => {
          sessionStorage.clear();
          window.location.href = '/index.html';
        });
    });
  }
  // Session timeout (20 min inactivity)
  let sessionTimeout;
  function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
      alert('Session abgelaufen. Du wirst abgemeldet.');
      fetch('/api/logout', { method: 'POST', credentials: 'include' })
        .finally(() => {
          sessionStorage.clear();
          window.location.href = '/index.html';
        });
    }, 20 * 60 * 1000);
  }
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetSessionTimeout);
  });
  resetSessionTimeout();
});
