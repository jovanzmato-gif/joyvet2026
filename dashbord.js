const products = [
  {name:"Amoxicillin Inj. 100ml", stock:6,  lowStockThreshold:10, expiryDate:"2026-10-05"},
  {name:"Oxytetracycline 20% LA", stock:14, lowStockThreshold:10, expiryDate:"2026-12-01"},
  {name:"ECF Vaccine (Muguga)",   stock:3,  lowStockThreshold:5,  expiryDate:"2026-09-30"},
  {name:"Broiler Starter Feed 70kg", stock:22, lowStockThreshold:15, expiryDate:"2027-03-10"},
  {name:"Dewormer (Albendazole)", stock:8,  lowStockThreshold:12, expiryDate:"2026-11-18"},
  {name:"Mineral Lick Supplement", stock:40, lowStockThreshold:20, expiryDate:"2027-01-15"},
];

const recentSales = [
  {product:"Amoxicillin Inj. 100ml", customer:"Nakabiito Farm", qty:2, amount:70000, time:"09:14 AM"},
  {product:"Broiler Starter Feed 70kg", customer:"Kato Poultry", qty:5, amount:625000, time:"10:02 AM"},
  {product:"Dewormer (Albendazole)", customer:"Walk-in", qty:1, amount:12000, time:"10:47 AM"},
  {product:"Mineral Lick Supplement", customer:"Ssebunya Dairy", qty:3, amount:135000, time:"11:20 AM"},
];

function formatUGX(n){
  return "UGX " + Number(n || 0).toLocaleString();
}

function daysUntil(dateStr){
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getTodaysSalesTotal(){
  return recentSales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
}

function getLowStockItems(){
  return products.filter(p => Number(p.stock || 0) < Number(p.lowStockThreshold || 0));
}

function getExpiringSoonItems(daysWindow = 30){
  return products.filter(p => daysUntil(p.expiryDate) <= daysWindow);
}

function renderStatCards(){
  const statGrid = document.getElementById('statGrid');
  if (!statGrid) return;

  const lowStock = getLowStockItems();
  const expiring = getExpiringSoonItems();
  const cards = [
    {icon:"💰", label:"Today's Sales", num: formatUGX(getTodaysSalesTotal()), cls:""},
    {icon:"💊", label:"Total Products", num: products.length, cls:""},
    {icon:"⚠️", label:"Low Stock Items", num: lowStock.length, cls:"alert"},
    {icon:"⏳", label:"Expiring Soon", num: expiring.length, cls:"amber"},
  ];

  statGrid.innerHTML = cards.map(c => `
    <div class="stat-card ${c.cls}">
      <div class="icon">${c.icon}</div>
      <div class="num">${c.num}</div>
      <div class="label">${c.label}</div>
    </div>
  `).join('');
}

function renderRecentSales(){
  const recentSalesBody = document.getElementById('recentSalesBody');
  if (!recentSalesBody) return;

  recentSalesBody.innerHTML = recentSales.map(s => `
    <tr>
      <td>${s.product}</td>
      <td>${s.customer}</td>
      <td>${s.qty}</td>
      <td class="amount">${formatUGX(s.amount)}</td>
      <td>${s.time}</td>
    </tr>
  `).join('');
}

function renderAlerts(){
  const alertsList = document.getElementById('alertsList');
  if (!alertsList) return;

  const lowStock = getLowStockItems().map(p => ({
    name: p.name,
    meta: `${p.stock} left (reorder below ${p.lowStockThreshold})`,
    tag: "LOW STOCK",
    tagClass: "tag-low"
  }));

  const expiring = getExpiringSoonItems().map(p => ({
    name: p.name,
    meta: `Expires in ${daysUntil(p.expiryDate)} day(s) — ${p.expiryDate}`,
    tag: "EXPIRING",
    tagClass: "tag-expiry"
  }));

  const all = [...lowStock, ...expiring];

  alertsList.innerHTML = all.map(a => `
    <div class="alert-item">
      <div>
        <div class="alert-name">${a.name}</div>
        <div class="alert-meta">${a.meta}</div>
      </div>
      <span class="alert-tag ${a.tagClass}">${a.tag}</span>
    </div>
  `).join('') || '<p style="font-size:12.5px; color:var(--muted);">No alerts right now.</p>';
}

function renderDate(){
  const dateEl = document.getElementById('todayDate');
  if (!dateEl) return;

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = 'Welcome back — ' + today.toLocaleDateString('en-UG', options);
}

function renderNavBadge(){
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

function renderAll(){
  renderDate();
  renderStatCards();
  renderRecentSales();
  renderAlerts();
  renderNavBadge();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderAll);
} else {
  renderAll();
}
