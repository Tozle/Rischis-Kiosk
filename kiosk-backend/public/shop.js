
// shop.js – Best Practice Refactor
import { $, getCsrfToken, showToast, showMessage } from './utils/frontend.js';
const BACKEND_URL = window.location.origin;
let currentUser = null;
let userBalance = 0;
let userSortedProducts = false;
let allProducts = [];

async function loadUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    const user = await res.json();
    if (!user?.id) throw new Error('Keine Nutzerdaten erhalten');
    currentUser = user;
    userBalance = user.balance || 0;
    $('user-email').textContent = user.email;
    const balanceElement = $('user-balance');
    balanceElement.textContent = `${userBalance.toFixed(2)} €`;
    balanceElement.className = userBalance < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
  } catch (err) {
    console.error(err);
    showMessage('Fehler beim Laden des Nutzers', 'error');
  }
}

async function loadProducts() {
  const loading = document.getElementById('product-list-loading');
  const list = document.getElementById('product-list');
  if (loading) loading.classList.remove('hidden');
  if (list) list.classList.add('opacity-30', 'pointer-events-none');
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
    if (loading) loading.classList.add('hidden');
    if (list) list.classList.remove('opacity-30', 'pointer-events-none');
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
    li.className = [
      'border',
      'border-cyan-900',
      'bg-gray-800/90',
      'backdrop-blur-md',
      'p-4',
      'rounded-2xl',
      'shadow-lg',
      'hover:shadow-xl',
      'transition',
      'text-cyan-100',
      'relative',
      product.recent ? 'border-yellow-400' : '',
    ].join(' ');

    const hasImage = product.image_url && product.image_url.trim() !== '';
    // Einheitlicher Bildcontainer, immer sichtbar, dunkler Hintergrund
    const placeholder = `<div class="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rounded-xl bg-cyan-950 border border-cyan-900 mx-auto sm:mx-0 p-2"><svg width="48" height="48" fill="none" stroke="#38bdf8" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 17l6-6a2 2 0 012.8 0l7.2 7"/></svg></div>`;
    li.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="shop-img-container">${placeholder}</div>
        <div class="flex-1 flex flex-col justify-between h-full w-full">
          <div>
            <p class="text-lg font-bold mb-1">${product.name}</p>
            ${product.recent ? '<p class="text-xs text-yellow-400 mb-1">Zuletzt gekauft</p>' : ''}
            <p class="text-base text-cyan-200 mb-2">${product.price.toFixed(2)} € <span class="mx-1">·</span> <span class="text-xs">Bestand: ${product.stock}</span></p>
          </div>
          <div class="mt-2 w-full">
            ${product.stock > 0
        ? `<div class="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 mt-2 w-full">
                  <div class='flex flex-row items-center gap-2 justify-center xs:justify-start'>
                    <button type="button" aria-label="Weniger" class="bg-cyan-100 text-cyan-900 text-lg px-3 py-2 rounded-full font-bold focus:ring-2 focus:ring-cyan-400 qty-minus-btn" data-id="${product.id}" data-max="${product.stock}">-</button>
                    <span id="qty-display-${product.id}" class="inline-block w-10 text-center select-none font-semibold text-lg">1</span>
                    <button type="button" aria-label="Mehr" class="bg-cyan-100 text-cyan-900 text-lg px-3 py-2 rounded-full font-bold focus:ring-2 focus:ring-cyan-400 qty-plus-btn" data-id="${product.id}" data-max="${product.stock}">+</button>
                  </div>
                  <button class="btn-main w-full xs:w-auto px-5 py-2 text-base buy-btn" style="min-width: 100px;" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Kaufen</button>
                </div>`
        : '<span class="text-red-400 font-semibold">Ausverkauft</span>'
      }
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
    // Progressive Image Loading
    if (hasImage) {
      const img = new window.Image();
      img.src = product.image_url;
      img.alt = product.name;
      img.width = 128;
      img.height = 128;
      img.className = [
        "w-24 h-24 sm:w-28 sm:h-28",
        "object-contain",
        "rounded-xl",
        "shadow-md",
        "border",
        "border-gray-200/60",
        "bg-white",
        "p-2",
        "mx-auto",
        "sm:mx-0",
        "block"
      ].join(" ");
      img.style.background = '#fff'; // explizit für PNGs mit Transparenz
      img.onload = () => {
        const container = li.querySelector('.shop-img-container');
        if (container) container.innerHTML = '';
        if (container) container.appendChild(img);
      };
      img.onerror = () => {
        // Fehlerbild oder Platzhalter lassen
      };
    }
  });
  // Event Delegation für Kaufen und Menge ändern
  list.onclick = function (e) {
    const minusBtn = e.target.closest('.qty-minus-btn');
    if (minusBtn) {
      changeQty(minusBtn.dataset.id, -1, parseInt(minusBtn.dataset.max));
      return;
    }
    const plusBtn = e.target.closest('.qty-plus-btn');
    if (plusBtn) {
      changeQty(plusBtn.dataset.id, 1, parseInt(plusBtn.dataset.max));
      return;
    }
    const buyBtn = e.target.closest('.buy-btn');
    if (buyBtn) {
      buyProduct(buyBtn.dataset.id, `qty-display-${buyBtn.dataset.id}`, buyBtn.dataset.name, parseFloat(buyBtn.dataset.price));
      return;
    }
  };
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
  } finally {
  }
}

async function buyProduct(productId, qtyInputId, productName, unitPrice) {
  const qty = parseInt(document.getElementById(qtyInputId)?.textContent || '1');
  if (!Number.isInteger(qty) || qty <= 0)
    return showMessage('Ungültige Menge', 'error');

  const confirmText = `Möchtest du wirklich ${qty}x ${productName} für ${(unitPrice * qty).toFixed(2)} € kaufen?`;
  if (!confirm(confirmText)) return;

  // Button-Feedback: Kaufen-Button finden und deaktivieren
  const buyBtn = document.querySelector(`.buy-btn[data-id="${productId}"]`);
  if (buyBtn) {
    buyBtn.disabled = true;
    buyBtn.textContent = '...';
  }
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
    // Button-Animation und Reset
    if (buyBtn) {
      buyBtn.textContent = 'Gekauft!';
      buyBtn.classList.add('bg-green-700');
      setTimeout(() => {
        buyBtn.textContent = 'Kaufen';
        buyBtn.classList.remove('bg-green-700');
        buyBtn.disabled = false;
      }, 1200);
    }
    // Menge zurücksetzen
    const qtyDisplay = document.getElementById(qtyInputId);
    if (qtyDisplay) qtyDisplay.textContent = '1';
    await loadUser();
    await loadProducts();
    await loadPurchaseHistory();
  } catch (err) {
    console.error(err);
    showMessage(err.message || 'Fehler beim Kauf', 'error');
    if (buyBtn) {
      buyBtn.textContent = 'Kaufen';
      buyBtn.disabled = false;
    }
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
    faqBtn.addEventListener('click', () => {
      faqOverlay.classList.remove('hidden');
      faqClose.focus();
    });
    faqClose.addEventListener('click', () => { faqOverlay.classList.add('hidden'); faqBtn.focus(); });
    faqOverlay.addEventListener('click', (e) => { if (e.target === faqOverlay) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
    document.addEventListener('keydown', (e) => { if (!faqOverlay.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) { faqOverlay.classList.add('hidden'); faqBtn.focus(); } });
  } else {
    // ...
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
