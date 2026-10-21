
// JoyVet dashboard: sign-in, sales, stock, workers and audit trail all use the database.

const state = {
  user: null,
  products: [],
  sales: [],
  auditLog: [],
  pending: null
};

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
  return 'UGX ' + Number(n || 0).toLocaleString();
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function lowStockItems() {
  return state.products.filter(p => Number(p.stock || 0) < Number(p.lowStockThreshold || 0));
}

function expiringItems(windowDays = 30) {
  return state.products.filter(p => {
    const d = daysUntil(p.expiryDate);
    return d !== null && d <= windowDays;
  });
}

function isOwner() {
  return !!state.user && state.user.role === 'Owner';
}

// Calls a PHP endpoint and always returns an object.
async function api(url, method = 'GET', body = null) {
  try {
    const res = await fetch(url, { method, body });
    return await res.json();
  } catch (err) {
    console.error('Request failed:', url, err);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
}

async function getList(url) {
  const data = await api(url);
  return Array.isArray(data) ? data : [];
}

function showStatus(id, text, ok) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('success', 'error');
  el.classList.add(ok ? 'success' : 'error');
}

function showLogin() {
  $('appShell').classList.add('hidden');
  $('authOverlay').classList.remove('hidden');
}

function showApp() {
  $('authOverlay').classList.add('hidden');
  $('appShell').classList.remove('hidden');
}

function renderCurrentUser() {
  const u = state.user;
  if (!u) return;
  const initials = u.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  if ($('userAvatar')) $('userAvatar').textContent = initials;
  if ($('currentUserName')) $('currentUserName').textContent = u.fullName;
  if ($('currentUserRole')) $('currentUserRole').textContent = u.role;
}

function syncAccessPermissions() {
  document.querySelectorAll('[data-owner-only]').forEach(panel => {
    panel.classList.toggle('hidden', !isOwner());
  });
}

function renderDate() {
  const el = $('todayDate');
  if (!el) return;
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = 'Welcome back — ' + new Date().toLocaleDateString('en-UG', options);
}

function renderStatCards() {
  const grid = $('statGrid');
  if (!grid) return;

  const total = state.sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const cards = [
    { icon: '💰', label: 'Recent Sales Total', num: formatUGX(total), cls: '' },
    { icon: '💊', label: 'Total Products', num: state.products.length, cls: '' },
    { icon: '⚠️', label: 'Low Stock Items', num: lowStockItems().length, cls: 'alert' },
    { icon: '⏳', label: 'Expiring Soon', num: expiringItems().length, cls: 'amber' }
  ];

  grid.innerHTML = cards.map(c => `
    <div class="stat-card ${c.cls}">
      <div class="icon">${c.icon}</div>
      <div class="num">${escapeHtml(c.num)}</div>
      <div class="label">${escapeHtml(c.label)}</div>
    </div>`).join('');
}

function renderRecentSales() {
  const body = $('recentSalesBody');
  if (!body) return;

  body.innerHTML = state.sales.map(s => `
    <tr>
      <td>${escapeHtml(s.product)}</td>
      <td>${escapeHtml(s.customer)}</td>
      <td>${escapeHtml(s.qty)}</td>
      <td class="amount">${escapeHtml(formatUGX(s.amount))}</td>
      <td>${escapeHtml(s.time)}</td>
    </tr>`).join('') ||
    '<tr><td colspan="5">No sales recorded yet.</td></tr>';
}

function renderAlerts() {
  const list = $('alertsList');
  if (!list) return;

  const low = lowStockItems().map(p => ({
    name: p.name,
    meta: `${p.stock} left (reorder below ${p.lowStockThreshold})`,
    tag: 'LOW STOCK',
    tagClass: 'tag-low'
  }));

  const expiring = expiringItems().map(p => ({
    name: p.name,
    meta: `Expires in ${daysUntil(p.expiryDate)} day(s) — ${p.expiryDate}`,
    tag: 'EXPIRING',
    tagClass: 'tag-expiry'
  }));

  list.innerHTML = [...low, ...expiring].map(item => `
    <div class="alert-item">
      <div>
        <div class="alert-name">${escapeHtml(item.name)}</div>
        <div class="alert-meta">${escapeHtml(item.meta)}</div>
      </div>
      <span class="alert-tag ${item.tagClass}">${escapeHtml(item.tag)}</span>
    </div>`).join('') ||
    '<p style="font-size:12.5px; color:var(--muted);">No alerts right now.</p>';
}

function renderInventoryTable() {
  const body = $('inventoryTableBody');
  if (!body) return;

  body.innerHTML = state.products.map(p => {
    const remaining = Number(p.stock || 0);
    let status = 'Healthy';
    let statusClass = 'status-active';

    if (remaining <= Number(p.lowStockThreshold || 0)) {
      status = 'Low stock';
      statusClass = 'status-done';
    }
    if (remaining <= 0) {
      status = 'Out of stock';
      statusClass = 'status-done';
    }

    return `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(remaining)}</td>
        <td>${escapeHtml(p.lowStockThreshold)}</td>
        <td>${escapeHtml(p.expiryDate || '')}</td>
        <td><span class="status-pill ${statusClass}">${status}</span></td>
      </tr>`;
  }).join('');
}

function populateProductSelect() {
  const select = $('stockProduct');
  if (!select) return;

  select.innerHTML = state.products.map(p => `
    <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.stock)} units)</option>`).join('');
}

function renderAuditLog() {
  const list = $('auditLogList');
  if (!list) return;

  list.innerHTML = state.auditLog.map(e => `
    <div class="audit-item">
      <div>
        <strong>${escapeHtml(e.action)}</strong>
        <small>${escapeHtml(e.actor)} • ${escapeHtml(e.role)} • ${escapeHtml(e.details)}</small>
        <small>${escapeHtml(e.time)}</small>
      </div>
      <span class="tag">${escapeHtml(e.role)}</span>
    </div>`).join('') ||
    '<p class="status-message">No activity recorded yet.</p>';
}

function renderAll() {
  renderCurrentUser();
  renderDate();
  renderStatCards();
  renderRecentSales();
  renderAlerts();
  renderInventoryTable();
  populateProductSelect();
  renderAuditLog();
  syncAccessPermissions();
}

async function loadAll() {
  const [products, sales, audit] = await Promise.all([
    getList('products_json.php'),
    getList('sales_json.php'),
    getList('audit_json.php')
  ]);
  state.products = products;
  state.sales = sales;
  state.auditLog = audit;
  renderAll();
}

// Shows the password box; the action runs only when the password is entered.
function askPassword(prompt, action) {
  state.pending = action;
  $('securePrompt').textContent = prompt;
  $('confirmPassword').value = '';
  $('secureError').textContent = '';
  $('secureModal').classList.remove('hidden');
  $('confirmPassword').focus();
}

function closeSecure() {
  state.pending = null;
  $('secureModal').classList.add('hidden');
}

async function confirmSecure(event) {
  event.preventDefault();
  if (!state.pending) {
    closeSecure();
    return;
  }
  const result = await state.pending($('confirmPassword').value);
  if (result.success) {
    closeSecure();
  } else {
    $('secureError').textContent = result.message;
  }
}

function setupStockForm() {
  const form = $('stockAdjustForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const productId = $('stockProduct').value;
    const qty = parseInt($('stockQty').value, 10);

    if (!productId || Number.isNaN(qty) || qty === 0) {
      showStatus('stockMessage', 'Select a product and enter a quantity other than zero.', false);
      return;
    }

    const product = state.products.find(p => String(p.id) === String(productId));
    const label = product ? product.name : 'this product';
    const summary = `${qty > 0 ? '+' : ''}${qty} ${label}`;

    askPassword(`Confirm stock update: ${summary}. Enter your password.`, async password => {
      const body = new FormData();
      body.append('product_id', productId);
      body.append('qty', qty);
      body.append('reason', $('stockReason').value);
      body.append('note', $('stockNote').value.trim());
      body.append('password', password);

      const result = await api('adjust_stock.php', 'POST', body);
      showStatus('stockMessage', result.message, result.success);

      if (result.success) {
        form.reset();
        await loadAll();
      }
      return result;
    });
  });
}

function setupWorkerForm() {
  const form = $('workerForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const fullName = $('workerName').value.trim();
    const username = $('workerUsername').value.trim();
    const pin = $('workerPin').value.trim();
    const password = $('workerPassword').value.trim();

    if (!fullName || !username || !pin || !password) {
      showStatus('workerMessage', 'Please complete all worker details.', false);
      return;
    }

    askPassword(`Create worker account for ${fullName}? Enter your password to confirm.`, async ownerPassword => {
      const body = new FormData();
      body.append('full_name', fullName);
      body.append('username', username);
      body.append('pin', pin);
      body.append('worker_password', password);
      body.append('password', ownerPassword);

      const result = await api('create_worker.php', 'POST', body);
      showStatus('workerMessage', result.message, result.success);

      if (result.success) {
        form.reset();
        await loadAll();
      }
      return result;
    });
  });
}

async function signIn(event) {
  event.preventDefault();

  const body = new FormData();
  body.append('username', $('loginUsername').value.trim());
  body.append('pin', $('loginPin').value.trim());

  const result = await api('login.php', 'POST', body);
  if (!result.success) {
    $('authError').textContent = result.message;
    return;
  }

  $('authError').textContent = '';
  $('loginPin').value = '';
  state.user = result.user;
  showApp();
  await loadAll();
}

async function signOut() {
  await api('logout.php', 'POST');
  state.user = null;
  state.products = [];
  state.sales = [];
  state.auditLog = [];
  showLogin();
}

async function checkSession() {
  const result = await api('me.php');
  if (result.success) {
    state.user = result.user;
    showApp();
    await loadAll();
  } else {
    showLogin();
  }
}

function setupEvents() {
  $('loginForm').addEventListener('submit', signIn);
  $('signOutBtn').addEventListener('click', signOut);
  $('secureForm').addEventListener('submit', confirmSecure);
  $('cancelConfirm').addEventListener('click', closeSecure);
  $('quickStockBtn').addEventListener('click', () => {
    $('stockAdjustForm').scrollIntoView({ behavior: 'smooth' });
    $('stockQty').focus();
  });
  setupStockForm();
  setupWorkerForm();
}

function start() {
  setupEvents();
  checkSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}