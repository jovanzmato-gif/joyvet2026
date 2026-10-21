// JoyVet customers: a read-only list built from orders and POS sales.

let customers = [];

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

function updateCounts() {
  $('custCount').textContent = customers.length;
  $('custWithPhone').textContent = customers.filter(c => c.phone).length;
  $('custValue').textContent = formatUGX(customers.reduce((sum, c) => sum + Number(c.total || 0), 0));
}

function render() {
  const term = $('searchBox').value.trim().toLowerCase();

  const shown = customers.filter(c => {
    if (!term) return true;
    return String(c.name).toLowerCase().includes(term)
      || String(c.phone || '').toLowerCase().includes(term);
  });

  $('custBody').innerHTML = shown.map(c => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.phone || '—')}</td>
      <td>${escapeHtml(c.orders)}</td>
      <td>${escapeHtml(c.sales)}</td>
      <td class="amount">${escapeHtml(c.sales ? formatUGX(c.total) : '—')}</td>
      <td>${escapeHtml(c.last)}</td>
    </tr>`).join('') ||
    '<tr><td colspan="6">No customers match this search.</td></tr>';
}

async function loadCustomers() {
  const data = await api('customers_json.php');
  if (!Array.isArray(data)) {
    $('custBody').innerHTML = '<tr><td colspan="6">Could not load customers. Please refresh.</td></tr>';
    return;
  }
  customers = data;
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
    $('custGate').classList.remove('hidden');
    $('custMain').classList.add('hidden');
    return;
  }

  $('custGate').classList.add('hidden');
  $('custMain').classList.remove('hidden');

  $('userAvatar').textContent = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  $('searchBox').addEventListener('input', render);
  $('refreshBtn').addEventListener('click', loadCustomers);
  $('signOutBtn').addEventListener('click', signOut);

  await loadCustomers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}