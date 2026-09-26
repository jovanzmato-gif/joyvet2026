const stockItems = [
  {name: 'Amoxicillin Inj. 100ml', stock: 6, lowStockThreshold: 10, expiryDate: '2026-10-05'},
  {name: 'Oxytetracycline 20% LA', stock: 14, lowStockThreshold: 10, expiryDate: '2026-12-01'},
  {name: 'ECF Vaccine (Muguga)', stock: 3, lowStockThreshold: 5, expiryDate: '2026-09-30'},
  {name: 'Broiler Starter Feed 70kg', stock: 22, lowStockThreshold: 15, expiryDate: '2027-03-10'},
  {name: 'Dewormer (Albendazole)', stock: 8, lowStockThreshold: 12, expiryDate: '2026-11-18'},
  {name: 'Mineral Lick Supplement', stock: 40, lowStockThreshold: 20, expiryDate: '2027-01-15'},
  {name: 'Wound Spray 200ml', stock: 0, lowStockThreshold: 4, expiryDate: '2027-02-14'},
];

function daysUntil(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getAlerts() {
  const lowStock = stockItems.filter(item => item.stock < item.lowStockThreshold);
  const expiringSoon = stockItems.filter(item => daysUntil(item.expiryDate) <= 30);
  return [
    ...lowStock.map(item => ({
      name: item.name,
      meta: `${item.stock} left (reorder below ${item.lowStockThreshold})`,
      tag: 'LOW STOCK',
      tagClass: 'tag-low'
    })),
    ...expiringSoon.map(item => ({
      name: item.name,
      meta: `Expires in ${daysUntil(item.expiryDate)} day(s) — ${item.expiryDate}`,
      tag: 'EXPIRING',
      tagClass: 'tag-expiry'
    }))
  ];
}

function renderStats() {
  const lowStock = stockItems.filter(item => item.stock < item.lowStockThreshold).length;
  const expiringSoon = stockItems.filter(item => daysUntil(item.expiryDate) <= 30).length;
  const cards = [
    {icon: '📦', label: 'Products', num: stockItems.length},
    {icon: '⚠️', label: 'Low Stock', num: lowStock, cls: 'alert'},
    {icon: '⏳', label: 'Expiring Soon', num: expiringSoon, cls: 'amber'},
    {icon: '✅', label: 'Healthy', num: stockItems.filter(item => item.stock >= item.lowStockThreshold && daysUntil(item.expiryDate) > 30).length}
  ];

  const container = document.getElementById('stockStats');
  if (!container) return;

  container.innerHTML = cards.map(c => `
    <div class="stat-card ${c.cls || ''}">
      <div class="icon">${c.icon}</div>
      <div class="num">${c.num}</div>
      <div class="label">${c.label}</div>
    </div>
  `).join('');
}

function renderAlerts() {
  const list = document.getElementById('alertsList');
  if (!list) return;

  const alerts = getAlerts();
  list.innerHTML = alerts.map(item => `
    <div class="alert-item">
      <div>
        <div class="alert-name">${item.name}</div>
        <div class="alert-meta">${item.meta}</div>
      </div>
      <span class="alert-tag ${item.tagClass}">${item.tag}</span>
    </div>
  `).join('') || '<p style="font-size:12.5px; color:var(--muted);">No alerts right now.</p>';
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

renderStats();
renderAlerts();
renderNavBadge();
