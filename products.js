let productList = [];

fetch('products_json.php')
  .then(res => res.json())
  .then(data => {
    productList = data;
    renderProductStats();
    renderProductsTable();
    renderNavBadge();
  })
  .catch(err => console.error('Could not load products:', err));

function daysUntil(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function renderProductStats() {
  const lowStock = productList.filter(p => p.stock < p.lowStockThreshold).length;
  const expiringSoon = productList.filter(p => daysUntil(p.expiryDate) <= 30).length;
  const cards = [
    {icon: '💊', label: 'Total Products', num: productList.length},
    {icon: '⚠️', label: 'Low Stock', num: lowStock, cls: 'alert'},
    {icon: '⏳', label: 'Expiring Soon', num: expiringSoon, cls: 'amber'},
    {icon: '💰', label: 'Product Value', num: `UGX ${productList.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString()}`},
  ];

  const container = document.getElementById('productStats');
  if (!container) return;

  container.innerHTML = cards.map(c => `
    <div class="stat-card ${c.cls || ''}">
      <div class="icon">${c.icon}</div>
      <div class="num">${c.num}</div>
      <div class="label">${c.label}</div>
    </div>
  `).join('');
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  tbody.innerHTML = productList.map(p => {
    const status = p.stock === 0 ? 'Out of stock' : p.stock < p.lowStockThreshold ? 'Low stock' : 'Healthy';
    const statusClass = p.stock === 0 ? 'status-unavailable' : p.stock < p.lowStockThreshold ? 'status-pending' : 'status-confirmed';
    return `
      <tr>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.stock}</td>
        <td class="amount">UGX ${p.price.toLocaleString()}</td>
        <td>${p.expiryDate}</td>
        <td><span class="status-pill ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderNavBadge() {
  const badge = document.getElementById('navBadge');
  if (!badge) return;
  try {
    const raw = localStorage.getItem('joyvet_orders');
    const orders = raw ? JSON.parse(raw) : [];
    const pending = Array.isArray(orders) ? orders.filter(o => o.status === 'pending').length : 0;
    badge.textContent = pending > 0 ? String(pending) : '';
  } catch (error) {
    badge.textContent = '';
  }
}


