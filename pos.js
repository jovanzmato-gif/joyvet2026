// JoyVet point of sale: builds a sale and saves it through create_sale.php.

const cart = [];
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

function showMsg(id, text, ok) {
  const el = $(id);
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (text) el.classList.add(ok ? 'success' : 'error');
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

async function loadProducts() {
  const data = await api('products_json.php');
  products = Array.isArray(data) ? data : [];
  $('posProduct').innerHTML = products.map(p => `
    <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.stock)} in stock)</option>`).join('');
}

function cartQtyFor(productId) {
  const line = cart.find(i => i.id === productId);
  return line ? line.qty : 0;
}

function renderCart() {
  let total = 0;

  $('cartBody').innerHTML = cart.map((item, index) => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;
    return `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.qty)}</td>
        <td>${escapeHtml(formatUGX(item.price))}</td>
        <td class="amount">${escapeHtml(formatUGX(lineTotal))}</td>
        <td><button class="btn-ghost btn-small" type="button" data-remove="${index}">Remove</button></td>
      </tr>`;
  }).join('') || '<tr><td colspan="5">No products added yet.</td></tr>';

  $('cartTotal').textContent = formatUGX(total);
}

function addItem() {
  const productId = Number($('posProduct').value);
  const qty = parseInt($('posQty').value, 10);
  const product = products.find(p => Number(p.id) === productId);

  if (!product) {
    showMsg('addMessage', 'Choose a product first.', false);
    return;
  }
  if (Number.isNaN(qty) || qty < 1) {
    showMsg('addMessage', 'Enter a quantity of at least 1.', false);
    return;
  }

  const alreadyInSale = cartQtyFor(productId);
  if (alreadyInSale + qty > Number(product.stock)) {
    showMsg('addMessage', `Only ${product.stock} ${product.name} in stock (${alreadyInSale} already in this sale).`, false);
    return;
  }

  const line = cart.find(i => i.id === productId);
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ id: productId, name: product.name, price: Number(product.price), qty });
  }

  showMsg('addMessage', '', true);
  $('posQty').value = 1;
  renderCart();
}

async function completeSale() {
  if (cart.length === 0) {
    showMsg('posMessage', 'Add at least one product before completing the sale.', false);
    return;
  }

  const method = $('paymentMethod').value;
  const detail = $('paymentDetail').value.trim();

  if ((method === 'mtn' || method === 'airtel') && detail === '') {
    showMsg('posMessage', 'Enter the phone number or reference for mobile money.', false);
    return;
  }

  $('completeSaleBtn').disabled = true;

  const body = new FormData();
  body.append('items', JSON.stringify(cart.map(i => ({ product_id: i.id, qty: i.qty }))));
  body.append('customer_name', $('customerName').value.trim());
  body.append('payment_method', method);
  body.append('payment_detail', detail);

  const result = await api('create_sale.php', 'POST', body);

  $('completeSaleBtn').disabled = false;
  showMsg('posMessage', result.message, result.success);

  if (result.success) {
    cart.length = 0;
    $('customerName').value = '';
    $('paymentDetail').value = '';
    renderCart();
    await loadProducts();
  }
}

function clearSale() {
  cart.length = 0;
  $('customerName').value = '';
  $('paymentDetail').value = '';
  $('paymentMethod').value = 'cash';
  showMsg('posMessage', '', true);
  renderCart();
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const me = await api('me.php');

  if (!me.success) {
    $('posGate').classList.remove('hidden');
    $('posMain').classList.add('hidden');
    return;
  }

  $('posGate').classList.add('hidden');
  $('posMain').classList.remove('hidden');

  const initials = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  $('addItemBtn').addEventListener('click', addItem);
  $('completeSaleBtn').addEventListener('click', completeSale);
  $('clearSaleBtn').addEventListener('click', clearSale);
  $('signOutBtn').addEventListener('click', signOut);
  $('cartBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    cart.splice(Number(btn.dataset.remove), 1);
    renderCart();
  });

  await loadProducts();
  renderCart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}