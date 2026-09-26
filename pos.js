let products = [
  {id:1, name:"Amoxicillin Inj. 100ml", price:35000, stock:6,  icon:"💉"},
  {id:2, name:"Oxytetracycline 20% LA", price:42000, stock:14, icon:"💉"},
  {id:3, name:"ECF Vaccine (Muguga)",   price:18000, stock:3,  icon:"🧪"},
  {id:4, name:"Broiler Starter Feed 70kg", price:125000, stock:22, icon:"🌾"},
  {id:5, name:"Dewormer (Albendazole)", price:12000, stock:8,  icon:"💊"},
  {id:6, name:"Mineral Lick Supplement", price:45000, stock:40, icon:"🧂"},
  {id:7, name:"Wound Spray 200ml", price:15000, stock:0,  icon:"🩹"},
  {id:8, name:"Layers Mash 70kg", price:118000, stock:17, icon:"🌾"},
];

const staffList = [
  {id:1, name:"Nabbosa Justine"},
  {id:2, name:"Kalema Brian"},
  {id:3, name:"Auma Ritah"},
];

let cart = [];
let selectedPayment = "cash";
let salesLog = [];

function populateCashierDropdown(){
  const select = document.getElementById('cashierSelect');
  staffList.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });
}

function renderClock(){
  const now = new Date();
  document.getElementById('posClock').textContent = now.toLocaleTimeString('en-UG', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
}

function renderProductGrid(){
  const query = document.getElementById('productSearch').value.toLowerCase().trim();
  const filtered = products.filter(p => p.name.toLowerCase().includes(query));
  document.getElementById('productGrid').innerHTML = filtered.map(p => `
    <div class="product-card ${p.stock === 0 ? 'out-of-stock' : ''}" onclick="${p.stock === 0 ? '' : addToCart(${p.id})}">
      <div class="product-icon">${p.icon}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">UGX ${p.price.toLocaleString()}</div>
      <div class="product-stock">${p.stock === 0 ? 'Out of stock' : p.stock + ' in stock'}</div>
    </div>
  `).join('');
}

function addToCart(productId){
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.productId === productId);
  if(existing){
    if(existing.qty < product.stock){ existing.qty += 1; }
  } else {
    cart.push({productId: product.id, name: product.name, price: product.price, qty: 1});
  }
  renderCart();
}

function changeQty(productId, delta){
  const item = cart.find(i => i.productId === productId);
  const product = products.find(p => p.id === productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){
    cart = cart.filter(i => i.productId !== productId);
  } else if(item.qty > product.stock){
    item.qty = product.stock;
  }
  renderCart();
}

function removeFromCart(productId){
  cart = cart.filter(i => i.productId !== productId);
  renderCart();
}

function clearCart(){ cart = []; renderCart(); }

function getCartTotal(){
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function renderCart(){
  const container = document.getElementById('cartItems');
  container.innerHTML = cart.length === 0
    ? '<p class="cart-empty">Cart is empty — tap a product to add it.</p>'
    : cart.map(item => `
        <div class="cart-item">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">UGX ${item.price.toLocaleString()} each</div>
          </div>
          <div class="qty-stepper">
            <button onclick="changeQty(${item.productId}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${item.productId}, 1)">+</button>
          </div>
          <span class="cart-remove" onclick="removeFromCart(${item.productId})">✕</span>
        </div>
      `).join('');
  document.getElementById('cartTotal').textContent = "UGX " + getCartTotal().toLocaleString();
  renderPaymentFields();
}

function selectPaymentMethod(method){
  selectedPayment = method;
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === method);
  });
  renderPaymentFields();
}

function renderPaymentFields(){
  const container = document.getElementById('paymentFields');
  const total = getCartTotal();
  if(selectedPayment === "cash"){
    container.innerHTML = `
      <div class="form-group">
        <label for="cashReceived">Amount received (UGX)</label>
        <input type="number" id="cashReceived" placeholder="e.g. ${total}" oninput="updateChange()">
      </div>
      <p id="changeDue" style="font-size:12.5px; font-weight:600; color:var(--teal);"></p>
    `;
  } else if(selectedPayment === "mtn" || selectedPayment === "airtel"){
    const label = selectedPayment === "mtn" ? "MTN MoMo number" : "Airtel Money number";
    container.innerHTML = `
      <div class="form-group">
        <label for="momoNumber">${label}</label>
        <input type="tel" id="momoNumber" placeholder="07XXXXXXXX">
      </div>
      <p style="font-size:11.5px; color:var(--muted);">Customer confirms UGX ${total.toLocaleString()} on their phone, then tap Complete Sale.</p>
    `;
  } else if(selectedPayment === "credit"){
    container.innerHTML = `
      <div class="form-group">
        <label for="creditCustomer">Customer name</label>
        <input type="text" id="creditCustomer" placeholder="e.g. Nakabiito Farm">
      </div>
      <p style="font-size:11.5px; color:var(--muted);">This sale will be recorded as owed by the customer (on account).</p>
    `;
  }
}

function updateChange(){
  const received = Number(document.getElementById('cashReceived').value) || 0;
  const total = getCartTotal();
  const change = received - total;
  document.getElementById('changeDue').textContent = change >= 0
    ? "Change due: UGX " + change.toLocaleString()
    : "Short by UGX " + Math.abs(change).toLocaleString();
}

function completeSale(){
  const errorEl = document.getElementById('posError');
  errorEl.textContent = '';
  if(cart.length === 0){ errorEl.textContent = "Cart is empty."; return; }

  const total = getCartTotal();
  const cashierId = Number(document.getElementById('cashierSelect').value);
  const cashier = staffList.find(s => s.id === cashierId);
  let paymentDetail = "";

  if(selectedPayment === "cash"){
    const received = Number(document.getElementById('cashReceived').value) || 0;
    if(received < total){ errorEl.textContent = "Amount received is less than the total."; return; }
    paymentDetail = "Cash — change given: UGX " + (received - total).toLocaleString();
  } else if(selectedPayment === "mtn" || selectedPayment === "airtel"){
    const number = document.getElementById('momoNumber').value.trim();
    if(!number){ errorEl.textContent = "Enter the customer's mobile money number."; return; }
    paymentDetail = (selectedPayment === "mtn" ? "MTN MoMo" : "Airtel Money") + " — " + number;
  } else if(selectedPayment === "credit"){
    const customer = document.getElementById('creditCustomer').value.trim();
    if(!customer){ errorEl.textContent = "Enter the customer's name for the account."; return; }
    paymentDetail = "On Account — owed by " + customer;
  }

  cart.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.qty;
  });

  const sale = {
    items: [...cart], total: total, payment: selectedPayment, paymentDetail: paymentDetail,
    cashier: cashier.name, time: new Date().toLocaleTimeString('en-UG', {hour:'2-digit', minute:'2-digit'})
  };
  salesLog.push(sale);

  showReceipt(sale);
  cart = [];
  renderCart();
  renderProductGrid();
}

function showReceipt(sale){
  const itemsHTML = sale.items.map(item => `
    <div class="receipt-line"><span>${item.name} x${item.qty}</span><span>UGX ${(item.price * item.qty).toLocaleString()}</span></div>
  `).join('');
  document.getElementById('receiptBody').innerHTML = `
    ${itemsHTML}
    <div class="receipt-line total"><span>Total</span><span>UGX ${sale.total.toLocaleString()}</span></div>
    <p class="receipt-meta">${sale.paymentDetail}<br>Served by ${sale.cashier} · ${sale.time}</p>
  `;
  document.getElementById('receiptOverlay').classList.remove('hidden');
}

function closeReceipt(){
  document.getElementById('receiptOverlay').classList.add('hidden');
  document.getElementById('posError').textContent = '';
}

function renderNavBadge(){
  const raw = localStorage.getItem('joyvet_orders');
  const orders = raw ? JSON.parse(raw) : [];
  const pending = orders.filter(o => o.status === "pending").length;
  const badge = document.getElementById('navBadge');
  if(badge) badge.textContent = pending > 0 ? pending : '';
}

populateCashierDropdown();
renderClock();
setInterval(renderClock, 1000);
renderProductGrid();
renderCart();
renderNavBadge();