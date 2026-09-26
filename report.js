function daysAgo(n){
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const salesHistory = [
  {date: daysAgo(0),  product:"Amoxicillin Inj. 100ml",   amount:70000,  worker:"Nabbosa Justine", payment:"cash"},
  {date: daysAgo(0),  product:"Broiler Starter Feed 70kg", amount:625000, worker:"Kalema Brian",    payment:"mtn"},
  {date: daysAgo(0),  product:"Dewormer (Albendazole)",    amount:12000,  worker:"Nabbosa Justine", payment:"cash"},
  {date: daysAgo(1),  product:"Mineral Lick Supplement",   amount:135000, worker:"Auma Ritah",      payment:"airtel"},
  {date: daysAgo(1),  product:"Oxytetracycline 20% LA",    amount:84000,  worker:"Kalema Brian",    payment:"cash"},
  {date: daysAgo(2),  product:"ECF Vaccine (Muguga)",      amount:54000,  worker:"Nabbosa Justine", payment:"credit"},
  {date: daysAgo(3),  product:"Layers Mash 70kg",          amount:236000, worker:"Auma Ritah",      payment:"mtn"},
  {date: daysAgo(4),  product:"Amoxicillin Inj. 100ml",    amount:35000,  worker:"Kalema Brian",    payment:"cash"},
  {date: daysAgo(6),  product:"Dewormer (Albendazole)",    amount:24000,  worker:"Auma Ritah",      payment:"cash"},
  {date: daysAgo(8),  product:"Broiler Starter Feed 70kg", amount:250000, worker:"Nabbosa Justine", payment:"mtn"},
  {date: daysAgo(10), product:"Mineral Lick Supplement",   amount:90000,  worker:"Kalema Brian",    payment:"airtel"},
  {date: daysAgo(14), product:"Oxytetracycline 20% LA",    amount:126000, worker:"Auma Ritah",      payment:"credit"},
  {date: daysAgo(20), product:"Layers Mash 70kg",          amount:118000, worker:"Nabbosa Justine", payment:"cash"},
  {date: daysAgo(35), product:"Amoxicillin Inj. 100ml",    amount:105000, worker:"Kalema Brian",    payment:"cash"},
  {date: daysAgo(60), product:"ECF Vaccine (Muguga)",      amount:36000,  worker:"Auma Ritah",      payment:"mtn"},
];

let currentPeriod = "today";

function isSameDay(a, b){ return a.toDateString() === b.toDateString(); }
function isSameMonth(a, b){ return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }
function isSameYear(a, b){ return a.getFullYear() === b.getFullYear(); }

function getFilteredSales(){
  const now = new Date();
  return salesHistory.filter(sale => {
    if(currentPeriod === "today") return isSameDay(sale.date, now);
    if(currentPeriod === "month") return isSameMonth(sale.date, now);
    if(currentPeriod === "year")  return isSameYear(sale.date, now);
  });
}

function setPeriod(period){
  currentPeriod = period;
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  renderReportsAll();
}

function formatUGX(n){ return "UGX " + n.toLocaleString(); }

function renderStats(){
  const sales = getFilteredSales();
  const total = sales.reduce((sum, s) => sum + s.amount, 0);
  const count = sales.length;
  const average = count > 0 ? Math.round(total / count) : 0;
  const cards = [
    {icon:"💰", label:"Total Sales", num: formatUGX(total)},
    {icon:"🧾", label:"Transactions", num: count},
    {icon:"📊", label:"Average Sale", num: formatUGX(average)},
  ];
  document.getElementById('reportStats').innerHTML = cards.map(c => `
    <div class="stat-card"><div class="icon">${c.icon}</div><div class="num">${c.num}</div><div class="label">${c.label}</div></div>
  `).join('');
}

function renderTopProducts(){
  const sales = getFilteredSales();
  const totals = {};
  sales.forEach(s => { totals[s.product] = (totals[s.product] || 0) + s.amount; });
  const ranked = Object.entries(totals).map(([name, amount]) => ({name, amount})).sort((a, b) => b.amount - a.amount);
  const highest = ranked.length > 0 ? ranked[0].amount : 1;
  document.getElementById('topProducts').innerHTML = ranked.length === 0
    ? '<p style="font-size:12.5px; color:var(--muted);">No sales in this period.</p>'
    : ranked.map(p => `
        <div class="bar-row">
          <div class="bar-label"><span class="name">${p.name}</span><span class="value">${formatUGX(p.amount)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(p.amount / highest) * 100}%"></div></div>
        </div>
      `).join('');
}

function renderStaffPerformance(){
  const sales = getFilteredSales();
  const byWorker = {};
  sales.forEach(s => {
    if(!byWorker[s.worker]) byWorker[s.worker] = {count: 0, total: 0};
    byWorker[s.worker].count += 1;
    byWorker[s.worker].total += s.amount;
  });
  const ranked = Object.entries(byWorker).map(([name, data]) => ({name, ...data})).sort((a, b) => b.total - a.total);
  document.getElementById('staffPerformanceBody').innerHTML = ranked.length === 0
    ? '<tr><td colspan="3" style="color:var(--muted); font-size:12px;">No sales in this period.</td></tr>'
    : ranked.map(w => <tr><td>${w.name}</td><td>${w.count}</td><td class="amount">${formatUGX(w.total)}</td></tr>).join('');
}

function renderPaymentBreakdown(){
  const sales = getFilteredSales();
  const total = sales.reduce((sum, s) => sum + s.amount, 0);
  const labels = {cash: "💵 Cash", mtn: "📱 MTN MoMo", airtel: "📱 Airtel Money", credit: "📒 On Account"};
  const totals = {cash: 0, mtn: 0, airtel: 0, credit: 0};
  sales.forEach(s => { totals[s.payment] += s.amount; });
  document.getElementById('paymentBreakdown').innerHTML = `
    <div class="payment-breakdown-grid">
      ${Object.keys(labels).map(key => {
        const amount = totals[key];
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        return `
          <div class="payment-stat">
            <div class="method-name">${labels[key]}</div>
            <div class="method-amount">${formatUGX(amount)}</div>
            <div class="method-pct">${pct}% of total</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderNavBadge(){
  const raw = localStorage.getItem('joyvet_orders');
  const orders = raw ? JSON.parse(raw) : [];
  const pending = orders.filter(o => o.status === "pending").length;
  const badge = document.getElementById('navBadge');
  if(badge) badge.textContent = pending > 0 ? pending : '';
}

function renderReportsAll(){
  renderStats();
  renderTopProducts();
  renderStaffPerformance();
  renderPaymentBreakdown();
}

renderReportsAll();
renderNavBadge();