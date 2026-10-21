// JoyVet customer order page: choose products, check quantities, and place the order.

const basket = new Map(); // product id -> { product, qty }
let products = [];

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatUGX(n) {
  return 'UGX ' + Math.round(Number(n || 0)).toLocaleString();
}

async function api(url, method = 'GET', body = null) {
  try {
    const res = await fetch(url, { method, body });
    return await res.json();
  } catch (err) {
    console.error('Request failed:', url, err);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
}

function availabilityLabel(status) {
  if (status === 'out') return { text: 'Out of stock', cls: 'avail-out' };
  if (status === 'limited') return { text: 'Limited stock', cls: 'avail-limited' };
  return { text: 'In stock', cls: 'avail-in' };
}

function renderProducts() {
  const term = $('searchBox').value.trim().toLowerCase();

  const shown = products.filter(p => {
    if (!term) return true;
    return String(p.name).toLowerCase().includes(term)
      || String(p.category || '').toLowerCase().includes(term);
  });

  $('productList').innerHTML = shown.map(p => {
    const avail = availabilityLabel(p.status);
    const inBasket = basket.has(p.id) ? basket.get(p.id).qty : 0;
    const disabled = p.status === 'out';

    return `
      <div class="product">
        <div>
          <strong>${escapeHtml(p.name)}</strong>
          <small>${escapeHtml(p.category || 'Product')}</small>
          <span class="price">${escapeHtml(formatUGX(p.price))}</span>
          <span class="avail ${avail.cls}">${avail.text}</span>
        </div>
        <div>
          <input class="qty" type="number" min="0" max="${p.available}" step="1"
                 value="${inBasket}" data-id="${p.id}" ${disabled ? 'disabled' : ''}
                 aria-label="Quantity of ${escapeHtml(p.name)}">
        </div>
      </div>`;
  }).join('') || '<p class="empty">No products match your search.</p>';
}

function renderBasket() {
  const lines = [...basket.values()];

  if (lines.length === 0) {
    $('cartList').innerHTML = '<p class="empty">No items yet.</p>';
    $('cartTotal').textContent = 'UGX 0';
    return;
  }

  let total = 0;
  $('cartList').innerHTML = lines.map(l => {
    const lineTotal = l.product.price * l.qty;
    total += lineTotal;
    return `
      <div class="cart-line">
        <span>${escapeHtml(l.qty)} × ${escapeHtml(l.product.name)}</span>
        <span>${escapeHtml(formatUGX(lineTotal))}</span>
      </div>`;
  }).join('');

  $('cartTotal').textContent = formatUGX(total);
}

function setQuantity(id, qty) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  // Never allow more than the availability shown for this product
  const max = Number(product.available || 0);
  let value = Math.floor(Number(qty) || 0);
  if (value < 0) value = 0;
  if (value > max) {
    value = max;
    showOrderMsg(`Only ${max} of ${product.name} can be ordered at a time.`, false);
  }

  if (value === 0) {
    basket.delete(id);
  } else {
    basket.set(id, { product, qty: value });
  }

  renderBasket();
}

function showOrderMsg(text, ok) {
  const el = $('orderMsg');
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (text) el.classList.add(ok ? 'success' : 'error');
}

async function loadProducts() {
  const data = await api('customer_products.php');

  if (!Array.isArray(data)) {
    $('productList').innerHTML = '<p class="empty">Could not load products. Please refresh the page.</p>';
    return;
  }

  products = data;
  renderProducts();
  renderBasket();
}

async function placeOrder() {
  if (basket.size === 0) {
    showOrderMsg('Add at least one product to your order.', false);
    return;
  }

  const method = $('method').value;
  const address = $('address').value.trim();

  if (method === 'delivery' && address === '') {
    showOrderMsg('Please enter a delivery address.', false);
    return;
  }

  $('submitBtn').disabled = true;

  const items = [...basket.values()].map(l => ({ product_id: l.product.id, quantity: l.qty }));

  const body = new FormData();
  body.append('items', JSON.stringify(items));
  body.append('method', method);
  body.append('address', address);
  body.append('note', $('note').value.trim());

  const result = await api('customer_order.php', 'POST', body);

  $('submitBtn').disabled = false;
  showOrderMsg(result.message, result.success);

  if (result.success) {
    basket.clear();
    $('note').value = '';
    $('address').value = '';
    renderBasket();
    await loadProducts();
  }
}

async function start() {
  const me = await api('customer_me.php');

  if (!me.success) {
    $('gate').classList.remove('hidden');
    return;
  }

  $('main').classList.remove('hidden');

  $('searchBox').addEventListener('input', renderProducts);

  // Quantity boxes: update the basket when a number is typed
  $('productList').addEventListener('change', e => {
    const input = e.target.closest('.qty');
    if (!input) return;
    setQuantity(Number(input.dataset.id), input.value);
    renderProducts();
  });

  $('method').addEventListener('change', () => {
    $('addressGroup').classList.toggle('hidden', $('method').value !== 'delivery');
  });

  $('submitBtn').addEventListener('click', placeOrder);

  await loadProducts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}