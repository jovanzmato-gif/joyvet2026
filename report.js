// JoyVet reports: owner-only summary of sales, stock, staff hours and orders for a date range.

const $ = id => document.getElementById(id);

const paymentLabels = { cash: 'Cash', mtn: 'MTN', airtel: 'Airtel', credit: 'Credit' };
const orderLabels = { pending: 'Pending', confirmed: 'Confirmed', unavailable: 'Unavailable', fulfilled: 'Fulfilled' };

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

// Builds YYYY-MM-DD from local date parts, so the day is never shifted by time zones
function dateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function showMsg(text, ok) {
  const el = $('repMessage');
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (text) el.classList.add(ok ? 'success' : 'error');
}

function renderReport(r) {
  $('repSub').textContent = `Figures from ${r.from} to ${r.to}. Stock and staff figures use the period shown.`;

  $('sCount').textContent = r.summary.sale_count;
  $('sTotal').textContent = formatUGX(r.summary.total);

  $('stockValue').textContent = formatUGX(r.stock.value);
  $('stockLow').textContent = r.stock.low;
  $('stockExpiring').textContent = r.stock.expiring;
  $('stockExpired').textContent = r.stock.expired;

  $('paymentBody').innerHTML = r.payments.map(p => `
    <tr>
      <td>${escapeHtml(paymentLabels[p.method] || p.method)}</td>
      <td>${escapeHtml(p.count)}</td>
      <td class="amount">${escapeHtml(formatUGX(p.total))}</td>
    </tr>`).join('') ||
    '<tr><td colspan="3">No sales in this period.</td></tr>';

  $('topBody').innerHTML = r.top.map(t => `
    <tr>
      <td>${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.qty)}</td>
      <td class="amount">${escapeHtml(formatUGX(t.amount))}</td>
    </tr>`).join('') ||
    '<tr><td colspan="3">No products sold in this period.</td></tr>';

  $('hoursBody').innerHTML = r.hours.map(h => `
    <tr>
      <td>${escapeHtml(h.name)}</td>
      <td>${escapeHtml(h.shifts)}</td>
      <td>${escapeHtml(h.hours.toFixed(2))}</td>
    </tr>`).join('') ||
    '<tr><td colspan="3">No staff records.</td></tr>';

  $('ordersBody').innerHTML = r.orders.map(o => `
    <tr>
      <td>${escapeHtml(orderLabels[o.status] || o.status)}</td>
      <td>${escapeHtml(o.count)}</td>
    </tr>`).join('') ||
    '<tr><td colspan="2">No orders in this period.</td></tr>';
}

async function runReport() {
  const from = $('fromDate').value;
  const to = $('toDate').value;

  if (!from || !to) {
    showMsg('Choose both dates.', false);
    return;
  }

  const r = await api(`reports_json.php?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

  if (!r.success) {
    showMsg(r.message || 'Could not load the report.', false);
    return;
  }

  showMsg('', true);
  renderReport(r);
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const me = await api('me.php');

  if (!me.success) {
    $('repGate').classList.remove('hidden');
    $('repMain').classList.add('hidden');
    $('repDenied').classList.add('hidden');
    return;
  }

  $('userAvatar').textContent = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  if (me.user.role !== 'Owner') {
    $('repGate').classList.add('hidden');
    $('repDenied').classList.remove('hidden');
    $('repMain').classList.add('hidden');
    return;
  }

  $('repGate').classList.add('hidden');
  $('repDenied').classList.add('hidden');
  $('repMain').classList.remove('hidden');

  // Default to the start of this month through today
  const now = new Date();
  $('fromDate').value = dateString(new Date(now.getFullYear(), now.getMonth(), 1));
  $('toDate').value = dateString(now);

  $('runBtn').addEventListener('click', runReport);
  $('printBtn').addEventListener('click', () => window.print());
  $('signOutBtn').addEventListener('click', signOut);

  await runReport();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}