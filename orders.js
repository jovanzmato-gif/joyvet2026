const ORDERS_KEY = 'joyvet_orders';

function loadOrders(){
  const raw = localStorage.getItem(ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveOrders(orders){
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

let statusFilter = "all";

function setStatusFilter(status){
  statusFilter = status;
  document.querySelectorAll('#statusFilter .period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
  renderOrders();
}

function renderStats(){
  const orders = loadOrders();
  const pending = orders.filter(o => o.status === "pending").length;
  const confirmed = orders.filter(o => o.status === "confirmed").length;
  const fulfilled = orders.filter(o => o.status === "fulfilled").length;

  const cards = [
    {icon:"🔔", label:"Pending", num: pending},
    {icon:"✅", label:"Confirmed", num: confirmed},
    {icon:"📦", label:"Fulfilled", num: fulfilled},
    {icon:"🧾", label:"Total Orders", num: orders.length},
  ];

  document.getElementById('orderStats').innerHTML = cards.map(c => `
    <div class="stat-card"><div class="icon">${c.icon}</div><div class="num">${c.num}</div><div class="label">${c.label}</div></div>
  `).join('');

  document.getElementById('navBadge').textContent = pending > 0 ? pending : '';
}

function renderOrders(){
  const orders = loadOrders()
    .slice()
    .reverse()
    .filter(o => statusFilter === "all" || o.status === statusFilter);

  document.getElementById('ordersList').innerHTML = orders.length === 0
    ? '<p style="font-size:12.5px; color:var(--muted);">No orders here.</p>'
    : orders.map(o => `
      <div class="order-card">
        <div class="order-card-top">
          <div>
            <div class="order-id">${o.id}</div>
            <div class="order-customer">${o.customerName} · ${o.phone} · ${o.method === 'delivery' ? 'Delivery to ' + o.address : 'Pickup at shop'}</div>
          </div>
          <span class="status-pill status-${o.status}">${o.status.toUpperCase()}</span>
        </div>

        <ul class="order-items-list">
          ${o.items.map(i => <li>${i.name} × ${i.qty}${i.type === 'chicks' ? ' — needed by ' + i.meta.neededBy : ''}</li>).join('')}
        </ul>

        ${o.staffNote ? <div class="track-note">Note: ${o.staffNote}</div> : ''}

        <div class="order-actions">
          ${o.status === "pending" ? `
            <button class="btn-confirm" onclick="respondToOrder('${o.id}', 'confirmed')">✓ Confirm Available</button>
            <button class="btn-unavailable" onclick="respondToOrder('${o.id}', 'unavailable')">✕ Mark Unavailable</button>
          ` : ''}
          ${o.status === "confirmed" ? `
            <button class="btn-fulfill" onclick="respondToOrder('${o.id}', 'fulfilled')">📦 Mark Fulfilled</button>
          ` : ''}
        </div>
      </div>
    `).join('');
}

function respondToOrder(orderId, newStatus){
  const orders = loadOrders();
  const order = orders.find(o => o.id === orderId);
  if(!order) return;

  if(newStatus === "unavailable"){
    const note = prompt("What's unavailable, or any note for the customer?", "");
    order.staffNote = note || "Some items are currently unavailable.";
  } else if(newStatus === "confirmed"){
    order.staffNote = "All items confirmed available.";
  } else if(newStatus === "fulfilled"){
    order.staffNote = order.staffNote || "Order completed.";
  }

  order.status = newStatus;
  saveOrders(orders);
  renderStats();
  renderOrders();
}

window.addEventListener('storage', (e) => {
  if(e.key === ORDERS_KEY){
    renderStats();
    renderOrders();
  }
});

renderStats();
renderOrders();