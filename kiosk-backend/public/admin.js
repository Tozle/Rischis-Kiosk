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
    li.className = 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-all';
    li.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p class="text-base font-semibold">${p.name}</p>
          <p class="text-sm text-gray-600 dark:text-gray-300">Preis: <strong>${p.price.toFixed(2)} €</strong> – Bestand: <strong>${p.stock}</strong> – Kategorie: <strong>${p.category || '-'}</strong></p>
        </div>
        <div class="flex flex-row gap-1 sm:ml-4">
          <button onclick="toggleAvailability('${p.id}', ${p.available})" class="bg-yellow-500 text-white text-xs px-2 py-1 rounded shadow hover:bg-yellow-600 focus:outline-none">
            ${p.available ? 'Verstecken' : 'Anzeigen'}
          </button>
          <button onclick="editProduct('${p.id}')" class="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-blue-700 focus:outline-none">
            Bearbeiten
          </button>
          <button onclick="deleteProduct('${p.id}')" class="bg-red-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-700 focus:outline-none">
            Löschen
          </button>
        </div>
      </div>`;
    list.appendChild(li);
  });
}

document.getElementById('category-filter')?.addEventListener('change', loadProducts);

async function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value.replace(',', '.'));
  const purchase_price = parseFloat(document.getElementById('product-purchase').value.replace(',', '.'));
  const stock = parseInt(document.getElementById('product-stock').value);
  const category = document.getElementById('product-category').value;
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    credentials: 'include',
    body: JSON.stringify({ name, price, purchase_price, stock, category, created_by: currentUserId })
  });
  const result = await res.json();
  const msgEl = document.getElementById('product-result');
  msgEl.textContent = res.ok ? 'Produkt gespeichert!' : `Fehler: ${result.error}`;
  if (res.ok) {
    e.target.reset();
    loadStats();
    loadProducts();
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

document.getElementById('add-product')?.addEventListener('submit', addProduct);

async function editProduct(id) {
  const res = await fetch(`${BACKEND_URL}/api/admin/products` , { credentials: 'include' });
  const products = await res.json();
  const p = products.find(x => x.id === id);
  if (!p) return;
  const newName = prompt('Neuen Produktnamen eingeben:', p.name);
  const newPrice = prompt('Neuen Verkaufspreis in € eingeben:', p.price);
  const newStock = prompt('Neuen Bestand eingeben:', p.stock);
  if (!newName || !newPrice || !newStock) return;
  const token = await getCsrfToken();
  await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    credentials: 'include',
    body: JSON.stringify({ name:newName, price:parseFloat(newPrice), stock:parseInt(newStock) })
  });
  loadProducts();
  loadStats();
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
  if (!confirm('Produkt löschen (Käufe bleiben erhalten)?')) return;
  const token3 = await getCsrfToken();
  await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'x-csrf-token': token3 },
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
  const list = document.getElementById('purchase-history');
  const items = data.map(e => `<li>${formatDateTime(e.created_at)} – <strong>${e.user_name}</strong> kaufte <strong>${e.quantity || 1}x ${e.product_name}</strong> für ${e.price.toFixed(2)} €</li>`).join('');
  if (initial) list.innerHTML = items; else list.innerHTML += items;
  purchaseOffset += purchaseLimit;
}

function loadMorePurchases() { loadPurchases(false); }

// ---------- Benutzer & Guthaben ----------
async function loadUserPasswords() {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
  const data = await res.json();
  const list = document.getElementById('user-manage-list');
  list.innerHTML = '';
  data.forEach(u => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center gap-2';
    const span = document.createElement('span');
    span.textContent = `${u.name} (${u.email})`;
    const btn = document.createElement('button');
    btn.textContent = 'Bearbeiten';
    btn.className = 'bg-blue-600 text-white px-2 rounded hover:bg-blue-700';
    btn.addEventListener('click', () => editUser(u.id, u.name));
    li.append(span, btn);
    list.appendChild(li);
  });
}

async function editUser(id, currentName) {
  const newName = prompt('Neuer Name:', currentName);
  if (newName && newName.trim() !== '') {
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
    if (!res.ok) {
      return alert('Fehler beim Speichern des Namens');
    }
  }
  const newPw = prompt('Neues Passwort (mind. 6 Zeichen, leer lassen zum Überspringen):');
  if (newPw) {
    if (newPw.length < 6) return alert('Passwort zu kurz.');
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
    if (!resPw.ok) {
      return alert('Fehler beim Ändern des Passworts');
    }
  }
  alert('Benutzerdaten gespeichert!');
  loadUserPasswords();
}

async function loadUserBalances() {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' });
  const data = await res.json();
  document.getElementById('balance-control-list').innerHTML = data.map(u => {
    const cls = u.balance < 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400';
    return `<li class="flex flex-wrap items-center gap-2">
      <span class="flex-1">${u.name}: <span class="${cls}">${u.balance.toFixed(2)} €</span></span>
      <input type="number" id="bal-${u.id}" class="w-20 border px-2 py-1" step="0.01" />
      <button onclick="updateBalance('${u.id}', 'add')" class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">+</button>
      <button onclick="updateBalance('${u.id}', 'subtract')" class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">-</button>
    </li>`;
  }).join('');
}

async function updateBalance(id, action) {
  const val = parseFloat(document.getElementById('bal-' + id).value);
  if (isNaN(val)) return alert('Ungültiger Betrag.');
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
  alert('Guthaben aktualisiert.');
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

async function loadBuyProducts() {
  const res = await fetch(`${BACKEND_URL}/api/admin/products`, { credentials: 'include' });
  const data = await res.json();
  const select = document.getElementById('buy-product');
  if (!select) return;
  select.innerHTML = data
    .filter(p => p.available && p.stock > 0)
    .map(p => `<option value="${p.id}">${p.name} (${p.stock})</option>`)
    .join('');
}

async function buyForUser(e) {
  e.preventDefault();
  const userId = document.getElementById('buy-user')?.value;
  const productId = document.getElementById('buy-product')?.value;
  const qty = parseInt(document.getElementById('buy-qty')?.value || '1');
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
  document.getElementById('buy-for-user-form')?.addEventListener('submit', buyForUser);
  if (typeof startSessionCheck === 'function') startSessionCheck();
});
