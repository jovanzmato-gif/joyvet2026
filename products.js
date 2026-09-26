const productList = [
  {name: 'Amoxicillin Inj. 100ml', category: 'Medicine', stock: 6, price: 35000, expiryDate: '2026-10-05', lowStockThreshold: 10},
  {name: 'Oxytetracycline 20% LA', category: 'Medicine', stock: 14, price: 42000, expiryDate: '2026-12-01', lowStockThreshold: 10},
  {name: 'ECF Vaccine (Muguga)', category: 'Vaccine', stock: 3, price: 18000, expiryDate: '2026-09-30', lowStockThreshold: 5},
  {name: 'Broiler Starter Feed 70kg', category: 'Feed', stock: 22, price: 125000, expiryDate: '2027-03-10', lowStockThreshold: 15},
  {name: 'Dewormer (Albendazole)', category: 'Medicine', stock: 8, price: 12000, expiryDate: '2026-11-18', lowStockThreshold: 12},
  {name: 'Mineral Lick Supplement', category: 'Supplement', stock: 40, price: 45000, expiryDate: '2027-01-15', lowStockThreshold: 20},
  {name: 'Wound Spray 200ml', category: 'Medicine', stock: 0, price: 15000, expiryDate: '2027-02-14', lowStockThreshold: 4},
  {name: 'Layers Mash 70kg', category: 'Feed', stock: 17, price: 118000, expiryDate: '2027-02-01', lowStockThreshold: 12},
];

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

renderProductStats();
renderProductsTable();
renderNavBadge();
