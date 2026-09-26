const ORDERS_KEY = 'joyvet_orders';

function loadOrders(){
  const raw = localStorage.getItem(ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveOrders(orders){
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

const updates = [
  {icon:"🐄", title:"ECF Vaccine now in stock", message:"Fresh batch of Muguga ECF vaccine just arrived — book early, cold-chain stock is limited.", date:"Sep 24, 2026"},
  {icon:"🎉", title:"10% off mineral supplements", message:"All mineral lick supplements are 10% off this week only. Applies to walk-in purchases.", date:"Sep 22, 2026"},
  {icon:"🐣", title:"Broiler chicks now taking pre-orders", message:"Order your day-old broiler chicks below — batches confirmed weekly.", date:"Sep 20, 2026"},
];

const portalProducts = [
  {name:"Amoxicillin Inj. 100ml", price:35000, category:"Medicines", inStock:true,  icon:"💉"},
  {name:"Oxytetracycline 20% LA", price:42000, category:"Medicines", inStock:true,  icon:"💉"},
  {name:"ECF Vaccine (Muguga)",   price:18000, category:"Vaccines",  inStock:true,  icon:"🧪"},
  {name:"Broiler Starter Feed 70kg", price:125000, category:"Feeds", inStock:true,  icon:"🌾"},
  {name:"Dewormer (Albendazole)", price:12000, category:"Medicines", inStock:true,  icon:"💊"},
  {name:"Mineral Lick Supplement", price:45000, category:"Supplements", inStock:true, icon:"🧂"},
  {name:"Wound Spray 200ml", price:15000, category:"Medicines", inStock:false, icon:"🩹"},
  {name:"Layers Mash 70kg", price:118000, category:"Feeds", inStock:true, icon:"🌾"},
];

let activeCategory = 'All';
let orderCart = [];

function renderUpdates() {
  const updatesList = document.getElementById('updatesList');
  if (!updatesList) return;

  updatesList.innerHTML = updates.map(u => `
    <div class="update-card">
      <div class="update-icon">${u.icon}</div>
      <div>
        <div class="update-title">${u.title}</div>
        <div class="update-message">${u.message}</div>
        <div class="update-date">${u.date}</div>
      </div>
    </div>
  `).join('');
}

function renderCategoryTabs() {
  const categoryTabs = document.getElementById('categoryTabs');
  if (!categoryTabs) return;

  const categories = ['All', ...new Set(portalProducts.map(p => p.category))];
  categoryTabs.innerHTML = categories.map(cat => `
    <button class="category-tab ${cat === activeCategory ? 'active' : ''}" onclick="setCategory('${cat}')">${cat}</button>
  `).join('');
}

function setCategory(category) {
  activeCategory = category;
  renderCategoryTabs();
  renderPortalProducts();
}

function renderPortalProducts() {
  const searchEl = document.getElementById('portalSearch');
  const gridEl = document.getElementById('portalProductGrid');
  if (!searchEl || !gridEl) return;

  const query = searchEl.value.toLowerCase().trim();
  const filtered = portalProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query);
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  gridEl.innerHTML = filtered.map(p => `
    <div class="portal-product-card">
      <div class="portal-product-icon">${p.icon}</div>
      <div class="portal-product-name">${p.name}</div>
      <div class="portal-product-price">UGX ${p.price.toLocaleString()}</div>
      <div class="portal-product-avail ${p.inStock ? 'avail-in' : 'avail-out'}">
        ${p.inStock ? '✓ In stock' : '✕ Out of stock'}
      </div>
      ${p.inStock ? `<button class="btn-ghost full-width" style="margin-top:10px;" onclick="addProductToOrder('${p.name.replace(/'/g, "\\'")}', '${p.category}')">+ Add to Order</button>` : ''}
    </div>
  `).join('') || '<p style="grid-column:1/-1; font-size:12.5px; color:var(--muted);">No products match your search.</p>';
}

function addProductToOrder(name, category) {
  const product = portalProducts.find(p => p.name === name);
  if (!product) return;

  const existing = orderCart.find(i => i.type === 'product' && i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    orderCart.push({type:'product', name: product.name, price: product.price, qty: 1, category: category || product.category});
  }
  renderOrderCart();
}

function addChicksToOrder() {
  const breed = document.getElementById('chickBreed').value;
  const qty = Number(document.getElementById('chickQty').value);
  const date = document.getElementById('chickDate').value;

  if (!qty || qty < 1) {
    alert('Enter how many chicks you need.');
    return;
  }
  if (!date) {
    alert('Select the date you need them by.');
    return;
  }

  orderCart.push({
    type: 'chicks',
    name: `${breed} Day-Old Chicks`,
    qty: qty,
    price: null,
    meta: { breed, neededBy: date }
  });

  document.getElementById('chickQty').value = '';
  document.getElementById('chickDate').value = '';
  renderOrderCart();
  scrollToOrder();
}

function changeCartQty(index, delta) {
  if (!orderCart[index]) return;

  orderCart[index].qty += delta;
  if (orderCart[index].qty <= 0) {
    orderCart.splice(index, 1);
  }
  renderOrderCart();
}

function removeFromCart(index) {
  orderCart.splice(index, 1);
  renderOrderCart();
}

function renderOrderCart() {
  const container = document.getElementById('orderCartItems');
  const cartCount = document.getElementById('cartCount');
  if (!container || !cartCount) return;

  cartCount.textContent = orderCart.reduce((sum, i) => sum + i.qty, 0);

  container.innerHTML = orderCart.length === 0
    ? '<p class="cart-empty">No items yet — browse products or pre-order chicks above.</p>'
    : orderCart.map((item, index) => `
        <div class="cart-item">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">
              ${item.type === 'chicks'
                ? `Needed by ${item.meta.neededBy} — price confirmed by shop`
                : `UGX ${item.price.toLocaleString()} each`}
            </div>
          </div>
          <div class="qty-stepper">
            <button onclick="changeCartQty(${index}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeCartQty(${index}, 1)">+</button>
          </div>
          <span class="cart-remove" onclick="removeFromCart(${index})">✕</span>
        </div>
      `).join('');
}

function initializeAddressToggle() {
  const custMethod = document.getElementById('custMethod');
  const addressGroup = document.getElementById('addressGroup');
  if (!custMethod || !addressGroup) return;

  custMethod.addEventListener('change', (e) => {
    addressGroup.style.display = e.target.value === 'delivery' ? 'block' : 'none';
  });
}

function placeOrder() {
  const errorEl = document.getElementById('orderError');
  if (!errorEl) return;
  errorEl.textContent = '';

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const method = document.getElementById('custMethod').value;
  const address = document.getElementById('custAddress').value.trim();

  if (orderCart.length === 0) {
    errorEl.textContent = 'Add at least one item before ordering.';
    return;
  }
  if (!name) {
    errorEl.textContent = 'Enter your name.';
    return;
  }
  if (!phone) {
    errorEl.textContent = 'Enter your phone number.';
    return;
  }
  if (method === 'delivery' && !address) {
    errorEl.textContent = 'Enter a delivery address or landmark.';
    return;
  }

  const orders = loadOrders();
  const newOrder = {
    id: 'ORD-' + Date.now().toString().slice(-6),
    customerName: name,
    phone: phone,
    method: method,
    address: method === 'delivery' ? address : null,
    items: [...orderCart],
    status: 'pending',
    staffNote: '',
    placedAt: new Date().toISOString()
  };

  orders.push(newOrder);
  saveOrders(orders);

  orderCart = [];
  renderOrderCart();

  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';

  alert('✅ Order placed! Your order ID is ' + newOrder.id + '. The shop will confirm availability shortly — you can check status below using your phone number.');
}

function trackOrders() {
  const phone = document.getElementById('trackPhone').value.trim();
  const resultsEl = document.getElementById('trackResults');
  if (!resultsEl) return;

  if (!phone) {
    resultsEl.innerHTML = '<p class="portal-error">Enter the phone number you ordered with.</p>';
    return;
  }

  const orders = loadOrders().filter(o => o.phone === phone);

  if (orders.length === 0) {
    resultsEl.innerHTML = '<p style="font-size:12.5px; color:var(--muted); margin-top:12px;">No orders found for that number.</p>';
    return;
  }

  const statusLabels = {
    pending: {text: '⏳ Waiting for confirmation', cls: 'status-pending'},
    confirmed: {text: '✅ Confirmed — ready as arranged', cls: 'status-confirmed'},
    unavailable: {text: '✕ Some items unavailable', cls: 'status-unavailable'},
    fulfilled: {text: '📦 Completed', cls: 'status-fulfilled'},
  };

  resultsEl.innerHTML = orders.reverse().map(o => `
    <div class="track-card">
      <div class="track-card-top">
        <span>${o.id}</span>
        <span class="status-pill ${statusLabels[o.status].cls}">${statusLabels[o.status].text}</span>
      </div>
      <div class="track-items">${o.items.map(i => i.name + ' x' + i.qty).join(', ')}</div>
      ${o.staffNote ? `<div class="track-note">Shop says: "${o.staffNote}"</div>` : ''}
    </div>
  `).join('');
}

function scrollToOrder() {
  const orderSection = document.getElementById('orderSection');
  if (orderSection) orderSection.scrollIntoView({behavior: 'smooth'});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderUpdates();
    renderCategoryTabs();
    renderPortalProducts();
    renderOrderCart();
    initializeAddressToggle();
  });
} else {
  renderUpdates();
  renderCategoryTabs();
  renderPortalProducts();
  renderOrderCart();
  initializeAddressToggle();
}
