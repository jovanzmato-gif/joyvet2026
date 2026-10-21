// JoyVet stock and expiry: shows low stock, out-of-stock and expiring products from the database.

const items = [];

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

// Returns a short status label and a CSS class for the status pill
function statusFor(item) {
  if (item.out_of_stock) return { label: 'Out of stock', cls: 'status-done' };
  if (item.expired) return { label: 'Expired', cls: 'status-done' };
  if (item.expiring_soon) return { label: 'Expiring soon', cls: 'status-done' };
  if (item.low_stock) return { label: 'Low stock', cls: 'status-done' };
  return { label: 'Healthy', cls: 'status-active' };
}

function matchesFilter(item, filter) {
  switch (filter) {
    case 'low': return item.low_stock;
    case 'out': return item.out_of_stock;
    case 'expiring': return item.expiring_soon;
    case 'expired': return item.expired;
    default: return true;
  }
}

function updateCounts() {
  $('lowCount').textContent = items.filter(i => i.low_stock).length;
  $('outCount').textContent = items.filter(i => i.out_of_stock).length;
  $('expiringCount').textContent = items.filter(i => i.expiring_soon).length;
  $('expiredCount').textContent = items.filter(i => i.expired).length;
}

function render() {
  const filter = $('filterSelect').value;
  const term = $('searchBox').value.trim().toLowerCase();

  const shown = items.filter(item => {
    if (!matchesFilter(item, filter)) return false;
    if (!term) return true;
    return String(item.name).toLowerCase().includes(term)
      || String(item.category || '').toLowerCase().includes(term);
  });

  $('stockBody').innerHTML = shown.map(item => {
    const status = statusFor(item);
    const daysText = item.days_left === null ? '—' : item.days_left;
    const expiryText = item.expiry_date || '—';

    return `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${escapeHtml(item.stock)}</td>
        <td>${escapeHtml(item.threshold)}</td>
        <td>${escapeHtml(expiryText)}</td>
        <td>${escapeHtml(daysText)}</td>
        <td><span class="status-pill ${status.cls}">${escapeHtml(status.label)}</span></td>
      </tr>`;
  }).join('') ||
    '<tr><td colspan="7">No products match this view.</td></tr>';
}

async function loadItems() {
  const data = await api('stock_expiry_json.php');
  if (!Array.isArray(data)) {
    $('stockBody').innerHTML = '<tr><td colspan="7">Could not load products. Please refresh.</td></tr>';
    return;
  }
  items.length = 0;
  items.push(...data);
  updateCounts();
  render();
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const me = await api('me.php');

  if (!me.success) {
    $('stockGate').classList.remove('hidden');
    $('stockMain').classList.add('hidden');
    return;
  }

  $('stockGate').classList.add('hidden');
  $('stockMain').classList.remove('hidden');

  const initials = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  $('filterSelect').addEventListener('change', render);
  $('searchBox').addEventListener('input', render);
  $('refreshBtn').addEventListener('click', loadItems);
  $('signOutBtn').addEventListener('click', signOut);

  await loadItems();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}