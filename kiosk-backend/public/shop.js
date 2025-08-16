// shop.js – ersetzt Supabase-Zugriffe durch sichere API-Aufrufe an dein Backend

// Backend und Frontend laufen auf derselben Domain
const BACKEND_URL = window.location.origin;

let currentUser = null;
let userBalance = 0;
let userSortedProducts = false;
let allProducts = [];

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

function showMessage(text, type = 'info') {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = type === 'error' ? 'text-red-600' : 'text-green-600';
  setTimeout(() => {
    el.textContent = '';
  }, 4000);
}

async function loadUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: 'include',
    });
    const user = await res.json();
    if (!user?.id) throw new Error('Keine Nutzerdaten erhalten');

    currentUser = user;
    userBalance = user.balance || 0;

    document.getElementById('user-email').textContent = user.email;
    const balanceElement = document.getElementById('user-balance');
    balanceElement.textContent = `${userBalance.toFixed(2)} €`;
    balanceElement.className =
      userBalance < 0
        ? 'text-red-600 dark:text-red-400 font-bold'
        : 'text-green-600 dark:text-green-400 font-bold';
  } catch (err) {
    console.error(err);
    showMessage('Fehler beim Laden des Nutzers', 'error');
  }
}

async function loadProducts() {
  try {
    const sortOption =
      document.getElementById('sort-products')?.value || 'price_asc';

    const productSort = sortOption === 'recent' ? 'price_asc' : sortOption;
    const productPromise = fetch(
      `${BACKEND_URL}/api/products?sort=${productSort}`,
    );

    const needRecent = sortOption === 'recent' || !userSortedProducts;
    const recentLimit = sortOption === 'recent' ? '' : '&limit=3';
    const recentPromise = needRecent
      ? fetch(`${BACKEND_URL}/api/purchases?sort=desc${recentLimit}`, {
        credentials: 'include',
      })
      : null;

    const [productRes, recentRes] = await Promise.all([
      productPromise,
      recentPromise,
    ]);
    const products = await productRes.json();
    const recent = recentRes ? await recentRes.json() : [];

    const recentIds = [];
    recent.forEach((r) => {
      if (!recentIds.includes(r.product_id)) recentIds.push(r.product_id);
    });

    if (needRecent && recentIds.length) {
      products.forEach((p) => {
        if (recentIds.includes(p.id)) p.recent = true;
      });

      products.sort((a, b) => {
        const ia = recentIds.indexOf(a.id);
        const ib = recentIds.indexOf(b.id);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return 0;
      });
    }

    allProducts = products;
    populateCategories(products);
    filterAndRenderProducts();
  } catch (err) {
    console.error(err);
    showMessage('Fehler beim Laden der Produkte', 'error');
  }
}

function populateCategories(products) {
  const select = document.getElementById('category-filter');
  if (!select) return;
  const current = select.value;
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  select.innerHTML = '<option value="">Alle Kategorien</option>';
  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
  if (current) select.value = current;
}

function filterAndRenderProducts() {
  const searchTerm =
    document.getElementById('search')?.value.toLowerCase() || '';
  const category = document.getElementById('category-filter')?.value || '';
  const filtered = allProducts.filter((p) => {
    const matchCat = !category || p.category === category;
    const matchSearch =
      !searchTerm || p.name.toLowerCase().includes(searchTerm);
    return matchCat && matchSearch;
  });
  renderProductList(filtered);
}

function renderProductList(products) {
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  products.forEach((product) => {
    const li = document.createElement('li');
    li.className =
      'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 rounded-lg shadow-md hover:shadow-lg transition text-gray-800 dark:text-white';
    if (product.recent) {
      li.className += ' border-yellow-400';
    }
    // Bild nur anzeigen, wenn image_url gesetzt und nicht leer
    const hasImage = product.image_url && product.image_url.trim() !== '';
    li.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          ${hasImage ? `<img src="${product.image_url}" alt="${product.name}" class="w-16 h-16 object-contain rounded shadow border border-gray-200 dark:border-gray-700 bg-white" loading="lazy">` : ''}
          <div>
            <p class="text-base font-medium">${product.name}</p>
            ${product.recent ? '<p class="text-xs text-yellow-600 dark:text-yellow-400">Zuletzt gekauft</p>' : ''}
            <p class="text-sm text-gray-600 dark:text-gray-300">${product.price.toFixed(2)} € – Bestand: ${product.stock}</p>
          </div>
        </div>
        ${product.stock > 0
        ? `<div class="flex items-center gap-2">
            <input type="number" min="1" max="${product.stock}" value="1" id="qty-${product.id}" class="w-12 text-center bg-transparent focus:outline-none border rounded dark:text-white">
            <button class="bg-green-600 text-white text-sm px-3 py-1 rounded-md shadow hover:bg-green-700" onclick="buyProduct('${product.id}', 'qty-${product.id}', '${product.name}', ${product.price})">Kaufen</button>
          </div>`
        : '<span class="text-red-500">Ausverkauft</span>'
      }
      </div>
    `;
    list.appendChild(li);
  });
}

async function loadPurchaseHistory() {
  try {
    const sortOption = document.getElementById('sort-history')?.value || 'desc';

    const res = await fetch(`${BACKEND_URL}/api/purchases?sort=${sortOption}`, {
      credentials: 'include',
    });
    const history = await res.json();

    if (!Array.isArray(history)) throw new Error('Ungültige Antwort');

    const list = document.getElementById('purchase-history');
    list.innerHTML = '';

    history.forEach((entry) => {
      const li = document.createElement('li');
      const date = new Date(entry.created_at).toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin',
      });
      li.textContent = `${date}: ${entry.quantity || 1}x ${entry.product_name} – ${entry.price.toFixed(2)} €`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    showMessage('Fehler beim Laden des Kaufverlaufs', 'error');
  }
}

async function buyProduct(productId, qtyInputId, productName, unitPrice) {
  const qty = parseInt(document.getElementById(qtyInputId)?.value || '1');
  if (!Number.isInteger(qty) || qty <= 0)
    return showMessage('Ungültige Menge', 'error');

  const confirmText = `Möchtest du wirklich ${qty}x ${productName} für ${(unitPrice * qty).toFixed(2)} € kaufen?`;
  if (!confirm(confirmText)) return;

  try {
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include',
      body: JSON.stringify({ product_id: productId, quantity: qty }),
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Unbekannter Fehler');

    const totalPrice = (unitPrice * qty).toFixed(2);
    showMessage(
      `Erfolgreich ${qty}x ${productName} für ${totalPrice} € gekauft!`,
      'success',
    );
    await loadUser();
    await loadProducts();
    await loadPurchaseHistory();
  } catch (err) {
    console.error(err);
    showMessage('Fehler beim Kauf', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  await loadProducts();
  await loadPurchaseHistory();
  if (typeof startSessionCheck === 'function') startSessionCheck();

  document
    .getElementById('sort-history')
    ?.addEventListener('change', loadPurchaseHistory);
  document.getElementById('sort-products')?.addEventListener('change', () => {
    userSortedProducts = true;
    loadProducts();
  });
  document
    .getElementById('search')
    ?.addEventListener('input', filterAndRenderProducts);
  document
    .getElementById('category-filter')
    ?.addEventListener('change', filterAndRenderProducts);
});
