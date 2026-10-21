// JoyVet orders: record customer orders, track their status, and turn fulfilled orders into sales.

const cart = [];
let products = [];
let orders = [];

const $ = id => document.getElementById(id);

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  unavailable: 'Unavailable',
  fulfilled: 'Fulfilled'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showMsg(id, text, ok) {
  const el = $(id);
  if (!el) return;
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

// Statuses that can follow the current one
function nextStatuses(status) {
  if (status === 'pending') return ['confirmed', 'unavailable', 'fulfilled'];
  if (status === 'confirmed') return ['unavailable', 'fulfilled'];
  return [];
}

function toggleItemFields() {
  const isChick = $('itemType').value === 'chick';
  $('productFields').classList.toggle('hidden', isChick);
  $('chickFields').classList.toggle('hidden', !isChick);
}

async function loadProducts() {
  const data = await api('products_json.php');
  products = Array.isArray(data) ? data : [];
  $('itemProduct').innerHTML = products.map(p => `
    <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.stock)} in stock)</option>`).join('');
}

async function loadOrders() {
  const data = await api('orders_json.php');
  orders = Array.isArray(data) ? data : [];
  renderOrders();
}

function renderCart() {
  $('cartBody').innerHTML = cart.map((item, index) => `
    <tr>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${escapeHtml(item.breed)}</td>
      <td>${escapeHtml(item.needed_by)}</td>
      <td><button class="btn-ghost btn-small" type="button" data-remove="${index}">Remove</button></td>
    </tr>`).join('') ||
    '<tr><td colspan="5">No items added yet.</td></tr>';
}

function addItem() {
  const isChick = $('itemType').value === 'chick';
  const qty = parseInt($('itemQty').value, 10);

  if (Number.isNaN(qty) || qty < 1) {
    showMsg('itemMessage', 'Enter a quantity of at least 1.', false);
    return;
  }

  if (isChick) {
    const name = $('itemName').value.trim();
    if (!name) {
      showMsg('itemMessage', 'Enter the item name.', false);
      return;
    }
    cart.push({
      is_chick_order: true,
      product_id: null,
      label: name,
      quantity: qty,
      breed: $('itemBreed').value.trim(),
      needed_by: $('itemNeeded').value
    });
    $('itemName').value = '';
    $('itemBreed').value = '';
    $('itemNeeded').value = '';
  } else {
    const pid = Number($('itemProduct').value);
    const product = products.find(p => Number(p.id) === pid);

    if (!product) {
      showMsg('itemMessage', 'Choose a product first.', false);
      return;
    }

    const alreadyOnOrder = cart
      .filter(i => i.product_id === pid)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (alreadyOnOrder + qty > Number(product.stock)) {
      showMsg('itemMessage', `Only ${product.stock} ${product.name} in stock (${alreadyOnOrder} already on this order).`, false);
      return;
    }

    cart.push({
      is_chick_order: false,
      product_id: pid,
      label: product.name,
      quantity: qty,
      breed: '',
      needed_by: ''
    });
  }

  $('itemQty').value = 1;
  showMsg('itemMessage', '', true);
  renderCart();
}

async function placeOrder() {
  const customer = $('orderCustomer').value.trim();
  const phone = $('orderPhone').value.trim();
  const method = $('orderMethod').value;
  const address = $('orderAddress').value.trim();

  if (cart.length === 0) {
    showMsg('orderMessage', 'Add at least one item before placing the order.', false);
    return;
  }
  if (!customer || !phone) {
    showMsg('orderMessage', 'Enter the customer name and phone number.', false);
    return;
  }
  if (method === 'delivery' && !address) {
    showMsg('orderMessage', 'Enter a delivery address.', false);
    return;
  }

  $('placeOrderBtn').disabled = true;

  const body = new FormData();
  body.append('customer_name', customer);
  body.append('phone', phone);
  body.append('method', method);
  body.append('address', address);
  body.append('staff_note', $('orderNote').value.trim());
  body.append('items', JSON.stringify(cart.map(i => ({
    product_id: i.product_id,
    item_name: i.label,
    quantity: i.quantity,
    is_chick_order: i.is_chick_order,
    breed: i.breed,
    needed_by: i.needed_by
  }))));

  const result = await api('order_create.php', 'POST', body);

  $('placeOrderBtn').disabled = false;
  showMsg('orderMessage', result.message, result.success);

  if (result.success) {
    cart.length = 0;
    ['orderCustomer', 'orderPhone', 'orderAddress', 'orderNote'].forEach(id => { $(id).value = ''; });
    $('orderMethod').value = 'pickup';
    renderCart();
    await loadProducts();
    await loadOrders();
  }
}

function renderOrders() {
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  if ($('navBadge')) {
    $('navBadge').textContent = pendingCount > 0 ? String(pendingCount) : '';
  }

  $('ordersBody').innerHTML = orders.map(o => {
    const next = nextStatuses(o.status);
    const actions = next.length
      ? `<select data-status-for="${escapeHtml(o.order_id)}">
           ${next.map(s => `<option value="${s}">${statusLabels[s]}</option>`).join('')}
         </select>
         <button class="btn-ghost btn-small" type="button" data-update="${escapeHtml(o.order_id)}">Update</button>`
      : '<span class="status-message">Final</span>';

    const addressLine = o.address ? `<br><small>${escapeHtml(o.address)}</small>` : '';
    const pillClass = o.status === 'fulfilled' ? 'status-active' : 'status-done';

    return `
      <tr>
        <td>${escapeHtml(o.order_id)}</td>
        <td>${escapeHtml(o.placed_at)}</td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td>${escapeHtml(o.phone)}</td>
        <td>${escapeHtml(o.method)}${addressLine}</td>
        <td>${escapeHtml(o.items)}</td>
        <td><span class="status-pill ${pillClass}">${escapeHtml(statusLabels[o.status] || o.status)}</span></td>
        <td>${actions}</td>
      </tr>`;
  }).join('') ||
    '<tr><td colspan="8">No orders yet.</td></tr>';
}

async function updateStatus(orderId) {
  const select = document.querySelector(`select[data-status-for="${CSS.escape(orderId)}"]`);
  if (!select) return;

  const newStatus = select.value;
  if (!confirm(`Change order ${orderId} to ${statusLabels[newStatus]}?`)) return;

  const body = new FormData();
  body.append('order_id', orderId);
  body.append('status', newStatus);

  const result = await api('order_update.php', 'POST', body);
  showMsg('updateMessage', result.message, result.success);

  await loadProducts();
  await loadOrders();
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const me = await api('me.php');

  if (!me.success) {
    $('ordersGate').classList.remove('hidden');
    $('ordersMain').classList.add('hidden');
    return;
  }

  $('ordersGate').classList.add('hidden');
  $('ordersMain').classList.remove('hidden');

  const initials = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  $('itemType').addEventListener('change', toggleItemFields);
  $('addItemBtn').addEventListener('click', addItem);
  $('placeOrderBtn').addEventListener('click', placeOrder);
  $('refreshBtn').addEventListener('click', async () => {
    await loadProducts();
    await loadOrders();
  });
  $('signOutBtn').addEventListener('click', signOut);

  $('cartBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    cart.splice(Number(btn.dataset.remove), 1);
    renderCart();
  });

  $('ordersBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-update]');
    if (btn) updateStatus(btn.dataset.update);
  });

  toggleItemFields();
  await loadProducts();
  await loadOrders();
  renderCart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}