const salesHistoryData = [
  {product: 'Amoxicillin Inj. 100ml', customer: 'Nakabiito Farm', qty: 2, amount: 70000, time: '09:14 AM', payment: 'Cash'},
  {product: 'Broiler Starter Feed 70kg', customer: 'Kato Poultry', qty: 5, amount: 625000, time: '10:02 AM', payment: 'MTN MoMo'},
  {product: 'Dewormer (Albendazole)', customer: 'Walk-in', qty: 1, amount: 12000, time: '10:47 AM', payment: 'Cash'},
  {product: 'Mineral Lick Supplement', customer: 'Ssebunya Dairy', qty: 3, amount: 135000, time: '11:20 AM', payment: 'Airtel Money'},
  {product: 'Oxytetracycline 20% LA', customer: 'Bulungi Dairy', qty: 2, amount: 84000, time: '12:35 PM', payment: 'On Account'},
  {product: 'ECF Vaccine (Muguga)', customer: 'Kabale Farmers Co-op', qty: 4, amount: 72000, time: '1:45 PM', payment: 'Cash'},
  {product: 'Layers Mash 70kg', customer: 'Mutesa House', qty: 1, amount: 118000, time: '3:10 PM', payment: 'MTN MoMo'},
];

function formatUGX(value) {
  return 'UGX ' + Number(value || 0).toLocaleString();
}

function renderSalesHistory() {
  const body = document.getElementById('salesHistoryBody');
  if (!body) return;
  body.innerHTML = salesHistoryData.map(sale => `
    <tr>
      <td>${sale.product}</td>
      <td>${sale.customer}</td>
      <td>${sale.qty}</td>
      <td class="amount">${formatUGX(sale.amount)}</td>
      <td>${sale.time}</td>
      <td>${sale.payment}</td>
    </tr>
  `).join('');
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

renderSalesHistory();
renderNavBadge();
