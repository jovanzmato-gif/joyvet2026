// JoyVet customer orders: shows only the signed-in customer's own orders and their status.

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

function badgeClass(status) {
  return 's-' + (['pending', 'confirmed', 'unavailable', 'fulfilled'].includes(status) ? status : 'pending');
}

function renderOrders(orders) {
  if (orders.length === 0) {
    $('ordersList').innerHTML = `
      <div class="panel empty">
        <p>You have not placed any orders yet.</p>
        <a class="btn" href="my-account-order.html">Place your first order</a>
      </div>`;
    return;
  }

  $('ordersList').innerHTML = orders.map(o => `
    <article class="panel">
      <div class="order-top">
        <div>
          <div class="order-id">${escapeHtml(o.order_id)}</div>
          <div class="order-date">${escapeHtml(o.placed_at)} · ${escapeHtml(o.method)}</div>
        </div>
        <span class="badge ${badgeClass(o.status)}">${escapeHtml(o.status_text)}</span>
      </div>
      <div class="items">${escapeHtml(o.items || 'No items recorded')}</div>
    </article>`).join('');
}

async function start() {
  const me = await api('customer_me.php');

  if (!me.success) {
    $('gate').classList.remove('hidden');
    return;
  }

  $('main').classList.remove('hidden');

  const data = await api('customer_orders_json.php');
  if (!Array.isArray(data)) {
    $('ordersList').innerHTML = '<div class="panel empty"><p>Could not load your orders. Please refresh the page.</p></div>';
    return;
  }

  renderOrders(data);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}