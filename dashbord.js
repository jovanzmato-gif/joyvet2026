// Joyvet dashboard: reads live data from the database.
// No sample data is stored in the browser.

const state = {
  products: [],
  sales: []
};

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

function getLowStockItems() {
  return state.products.filter(p => Number(p.stock || 0) < Number(p.lowStockThreshold || 0));
}

function getExpiringSoonItems(windowDays = 30) {
  return state.products.filter(p => {
    const d = daysUntil(p.expiryDate);
    return d !== null && d <= windowDays;
  });
}

function renderDate() {
  const el = document.getElementById('todayDate');
  if (!el) return;
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = 'Welcome back — ' + new Date().toLocaleDateString('en-UG', options);
}

function renderStatCards() {
  const grid = document.getElementById('statGrid');
  if (!grid) return;

  const total = state.sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const cards = [
    { icon: '💰', label: 'Recent Sales Total', num: formatUGX(total), cls: '' },
    { icon: '💊', label: 'Total Products', num: state.products.length, cls: '' },
    { icon: '⚠️', label: 'Low Stock Items', num: getLowStockItems().length, cls: 'alert' },
    { icon: '⏳', label: 'Expiring Soon', num: getExpiringSoonItems().length, cls: 'amber' }
  ];

  grid.innerHTML = cards.map(c => `
    <div class="stat-card ${c.cls}">
      <div class="icon">${c.icon}</div>
      <div class="num">${escapeHtml(c.num)}</div>
      <div class="label">${escapeHtml(c.label)}</div>
    </div>`).join('');
}

function renderRecentSales() {
  const body = document.getElementById('recentSalesBody');
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
  const list = document.getElementById('alertsList');
  if (!list) return;

  const low = getLowStockItems().map(p => ({
    name: p.name,
    meta: `${p.stock} left (reorder below ${p.lowStockThreshold})`,
    tag: 'LOW STOCK',
    tagClass: 'tag-low'
  }));

  const expiring = getExpiringSoonItems().map(p => ({
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
  const body = document.getElementById('inventoryTableBody');
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
  const select = document.getElementById('stockProduct');
  if (!select) return;

  select.innerHTML = state.products.map(p => `
    <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.stock)} units)</option>`).join('');
}

function renderNavBadge() {
  const badge = document.getElementById('navBadge');
  if (badge) badge.textContent = '';
}

function showAppScreen() {
  const appShell = document.getElementById('appShell');
  const authOverlay = document.getElementById('authOverlay');
  if (appShell) appShell.classList.remove('hidden');
  if (authOverlay) authOverlay.classList.add('hidden');
}

function setupStockForm() {
  const form = document.getElementById('stockAdjustForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const msg = document.getElementById('stockMessage');
    const productId = document.getElementById('stockProduct').value;
    const qty = document.getElementById('stockQty').value;

    const body = new FormData();
    body.append('product_id', productId);
    body.append('qty', qty);

    try {
      const res = await fetch('adjust_stock.php', { method: 'POST', body });
      const result = await res.json();

      if (msg) {
        msg.textContent = result.message;
        msg.classList.remove('success', 'error');
        msg.classList.add(result.success ? 'success' : 'error');
      }

      if (result.success) {
        form.reset();
        await loadData();
      }
    } catch (err) {
      console.error('Stock update failed:', err);
      if (msg) {
        msg.textContent = 'Could not reach the server. Please try again.';
        msg.classList.remove('success');
        msg.classList.add('error');
      }
    }
  });
}

function renderAll() {
  showAppScreen();
  renderDate();
  renderStatCards();
  renderRecentSales();
  renderAlerts();
  renderInventoryTable();
  populateProductSelect();
  renderNavBadge();
}

async function loadData() {
  try {
    const [products, sales] = await Promise.all([
      fetch('products_json.php').then(r => r.json()),
      fetch('sales_json.php').then(r => r.json())
    ]);
    state.products = Array.isArray(products) ? products : [];
    state.sales = Array.isArray(sales) ? sales : [];
  } catch (err) {
    console.error('Could not load data from database:', err);
  }
  renderAll();
}

function start() {
  setupStockForm();
  loadData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
