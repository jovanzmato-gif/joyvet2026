// JoyVet sales history: lists recorded sales from the database.

const sales = [];

const $ = id => document.getElementById(id);

const paymentLabels = { cash: 'Cash', mtn: 'MTN', airtel: 'Airtel', credit: 'Credit' };

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

function matchesSearch(sale, term) {
  if (!term) return true;
  return String(sale.sale_id).includes(term)
    || String(sale.customer || '').toLowerCase().includes(term)
    || String(sale.items || '').toLowerCase().includes(term)
    || String(sale.staff || '').toLowerCase().includes(term);
}

function renderHistory() {
  const term = $('searchBox').value.trim().toLowerCase();
  const shown = sales.filter(s => matchesSearch(s, term));

  const total = shown.reduce((sum, s) => sum + Number(s.total || 0), 0);
  $('saleCount').textContent = shown.length;
  $('saleTotal').textContent = formatUGX(total);

  $('historyBody').innerHTML = shown.map(s => `
    <tr>
      <td>#${escapeHtml(s.sale_id)}</td>
      <td>${escapeHtml(s.sale_date)}</td>
      <td>${escapeHtml(s.customer)}</td>
      <td>${escapeHtml(s.items)}</td>
      <td>${escapeHtml(s.staff)}</td>
      <td>${escapeHtml(paymentLabels[s.payment_method] || s.payment_method)}</td>
      <td class="amount">${escapeHtml(formatUGX(s.total))}</td>
    </tr>`).join('') ||
    '<tr><td colspan="7">No sales match your search.</td></tr>';
}

async function loadSales() {
  const data = await api('sales_history_json.php');
  if (!Array.isArray(data)) {
    $('historyBody').innerHTML = '<tr><td colspan="7">Could not load sales. Please refresh.</td></tr>';
    return;
  }
  sales.length = 0;
  sales.push(...data);
  renderHistory();
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const me = await api('me.php');

  if (!me.success) {
    $('historyGate').classList.remove('hidden');
    $('historyMain').classList.add('hidden');
    return;
  }

  $('historyGate').classList.add('hidden');
  $('historyMain').classList.remove('hidden');

  const initials = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  $('searchBox').addEventListener('input', renderHistory);
  $('refreshBtn').addEventListener('click', loadSales);
  $('signOutBtn').addEventListener('click', signOut);

  await loadSales();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}