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
  // Toast-Benachrichtigungssystem wie im Adminbereich
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.className = `fixed left-1/2 top-6 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-sm font-semibold transition-opacity duration-300 pointer-events-none ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white opacity-100`;
  setTimeout(() => {
    toast.classList.add('opacity-0');
  }, 4000);
}

async function loadUser() {
  // Loader removed
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
  } finally {
    // Loader removed
  }
}

async function loadProducts() {
  // Loader removed
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
  } finally {
    // Loader removed
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
      'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 rounded-xl shadow-md hover:shadow-lg transition text-gray-800 dark:text-white';
    if (product.recent) {
      li.className += ' border-yellow-400';
    }
    // Bild nur anzeigen, wenn image_url gesetzt und nicht leer
    const hasImage = product.image_url && product.image_url.trim() !== '';
    li.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        ${hasImage ? `<img src="${product.image_url}" alt="${product.name}" class="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl shadow border border-gray-200 dark:border-gray-700 bg-white flex-shrink-0 mx-auto sm:mx-0" loading="lazy">` : ''}
        <div class="flex-1 flex flex-col justify-between h-full w-full">
          <div>
            <p class="text-lg font-bold mb-1">${product.name}</p>
            ${product.recent ? '<p class="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Zuletzt gekauft</p>' : ''}
            <p class="text-base text-gray-600 dark:text-gray-300 mb-2">${product.price.toFixed(2)} € <span class="mx-1">·</span> <span class="text-xs">Bestand: ${product.stock}</span></p>
          </div>
          <div class="mt-2 w-full">
            ${product.stock > 0
        ? `<div class="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 mt-2 w-full">
                  <div class='flex flex-row items-center gap-2 justify-center xs:justify-start'>
                    <button type="button" aria-label="Weniger" class="bg-gray-200 dark:bg-gray-600 text-lg px-3 py-2 rounded-full font-bold focus:ring-2 focus:ring-cyan-400" onclick="changeQty('${product.id}', -1, ${product.stock})">-</button>
                    <span id="qty-display-${product.id}" class="inline-block w-10 text-center select-none font-semibold text-lg">1</span>
                    <button type="button" aria-label="Mehr" class="bg-gray-200 dark:bg-gray-600 text-lg px-3 py-2 rounded-full font-bold focus:ring-2 focus:ring-cyan-400" onclick="changeQty('${product.id}', 1, ${product.stock})">+</button>
                  </div>
                  <button class="btn-main w-full xs:w-auto px-5 py-2 text-base" style="min-width: 100px;" onclick="buyProduct('${product.id}', 'qty-display-${product.id}', '${product.name}', ${product.price})">Kaufen</button>
                </div>`
        : '<span class="text-red-500 font-semibold">Ausverkauft</span>'
      }
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
  });
}

async function loadPurchaseHistory() {
  // Loader removed
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
  } finally {
    // Loader removed
  }
}

async function buyProduct(productId, qtyInputId, productName, unitPrice) {
  const qty = parseInt(document.getElementById(qtyInputId)?.textContent || '1');
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

function changeQty(productId, delta, maxStock) {
  const display = document.getElementById(`qty-display-${productId}`);
  if (!display) return;
  let qty = parseInt(display.textContent || '1');
  qty += delta;
  if (qty < 1) qty = 1;
  if (qty > maxStock) qty = maxStock;
  display.textContent = qty;
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

  // FAQ Overlay-Logik
  const faqBtn = document.getElementById('faq-btn');
  const faqOverlay = document.getElementById('faq-overlay');
  const faqClose = document.getElementById('faq-close');
  if (faqBtn && faqOverlay && faqClose) {
    faqBtn.addEventListener('click', () => { faqOverlay.classList.remove('hidden'); faqClose.focus(); });
    faqClose.addEventListener('click', () => { faqOverlay.classList.add('hidden'); faqBtn.focus(); });
    faqOverlay.addEventListener('click', (e) => { if (e.target === faqOverlay) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
    document.addEventListener('keydown', (e) => { if (!faqOverlay.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
  }

  // Darkmode logic
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

  // Logout and session timeout logic
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
