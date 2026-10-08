const STORAGE_KEYS = {
  products: 'joyvet_products',
  sales: 'joyvet_recent_sales',
  users: 'joyvet_users',
  activeUser: 'joyvet_active_user',
  orders: 'joyvet_orders'
};

const defaultProducts = [
  { id: 'amoxicillin', name: 'Amoxicillin Inj. 100ml', stock: 6, lowStockThreshold: 10, expiryDate: '2026-10-05' },
  { id: 'oxy', name: 'Oxytetracycline 20% LA', stock: 14, lowStockThreshold: 10, expiryDate: '2026-12-01' },
  { id: 'ecf', name: 'ECF Vaccine (Muguga)', stock: 3, lowStockThreshold: 5, expiryDate: '2026-09-30' },
  { id: 'feed', name: 'Broiler Starter Feed 70kg', stock: 22, lowStockThreshold: 15, expiryDate: '2027-03-10' },
  { id: 'dewormer', name: 'Dewormer (Albendazole)', stock: 8, lowStockThreshold: 12, expiryDate: '2026-11-18' },
  { id: 'mineral', name: 'Mineral Lick Supplement', stock: 40, lowStockThreshold: 20, expiryDate: '2027-01-15' }
];

const defaultSales = [
  { product: 'Amoxicillin Inj. 100ml', customer: 'Nakabiito Farm', qty: 2, amount: 70000, time: '09:14 AM' },
  { product: 'Broiler Starter Feed 70kg', customer: 'Kato Poultry', qty: 5, amount: 625000, time: '10:02 AM' },
  { product: 'Dewormer (Albendazole)', customer: 'Walk-in', qty: 1, amount: 12000, time: '10:47 AM' },
  { product: 'Mineral Lick Supplement', customer: 'Ssebunya Dairy', qty: 3, amount: 135000, time: '11:20 AM' }
];

const defaultUsers = [
  {
    id: 'owner-1',
    fullName: 'Yiga Josephat',
    role: 'Owner',
    username: 'owner',
    pin: '1234',
    password: 'joyvet123',
    isOwner: true
  }
];

const state = {
  users: [],
  products: [],
  sales: [],
  activeUser: null,
  pendingAction: null
};

function getJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ensureSeedData() {
  const savedUsers = getJson(STORAGE_KEYS.users, null);
  const savedProducts = getJson(STORAGE_KEYS.products, null);
  const savedSales = getJson(STORAGE_KEYS.sales, null);

  state.users = Array.isArray(savedUsers) && savedUsers.length ? savedUsers : defaultUsers;
  state.products = Array.isArray(savedProducts) && savedProducts.length ? savedProducts : defaultProducts;
  state.sales = Array.isArray(savedSales) && savedSales.length ? savedSales : defaultSales;

  saveJson(STORAGE_KEYS.users, state.users);
  saveJson(STORAGE_KEYS.products, state.products);
  saveJson(STORAGE_KEYS.sales, state.sales);

  const activeUserId = localStorage.getItem(STORAGE_KEYS.activeUser);
  state.activeUser = state.users.find(user => user.id === activeUserId) || state.users[0];
}

function getActiveUser() {
  ensureSeedData();
  const activeUserId = localStorage.getItem(STORAGE_KEYS.activeUser);
  return state.users.find(user => user.id === activeUserId) || state.users[0] || null;
}

function setActiveUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.activeUser);
    state.activeUser = null;
    return;
  }
  state.activeUser = user;
  localStorage.setItem(STORAGE_KEYS.activeUser, String(user.id));
}

function formatUGX(n) {
  return 'UGX ' + Number(n || 0).toLocaleString();
}

function daysUntil(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getLowStockItems() {
  return state.products.filter(item => Number(item.stock || 0) < Number(item.lowStockThreshold || 0));
}

function getExpiringSoonItems(daysWindow = 30) {
  return state.products.filter(item => Number(daysUntil(item.expiryDate)) <= daysWindow);
}

function renderStatCards() {
  const statGrid = document.getElementById('statGrid');
  if (!statGrid) return;

  const lowStock = getLowStockItems();
  const expiring = getExpiringSoonItems();
  const cards = [
    { icon: '💰', label: "Today's Sales", num: formatUGX(state.sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0)), cls: '' },
    { icon: '💊', label: 'Total Products', num: state.products.length, cls: '' },
    { icon: '⚠️', label: 'Low Stock Items', num: lowStock.length, cls: 'alert' },
    { icon: '⏳', label: 'Expiring Soon', num: expiring.length, cls: 'amber' }
  ];

  statGrid.innerHTML = cards.map(card => `
    <div class="stat-card ${card.cls}">
      <div class="icon">${card.icon}</div>
      <div class="num">${escapeHtml(card.num)}</div>
      <div class="label">${escapeHtml(card.label)}</div>
    </div>
  `).join('');
}

function renderRecentSales() {
  const recentSalesBody = document.getElementById('recentSalesBody');
  if (!recentSalesBody) return;

  recentSalesBody.innerHTML = state.sales.map(sale => `
    <tr>
      <td>${escapeHtml(sale.product)}</td>
      <td>${escapeHtml(sale.customer)}</td>
      <td>${escapeHtml(sale.qty)}</td>
      <td class="amount">${escapeHtml(formatUGX(sale.amount))}</td>
      <td>${escapeHtml(sale.time)}</td>
    </tr>
  `).join('');
}

function renderAlerts() {
  const alertsList = document.getElementById('alertsList');
  if (!alertsList) return;

  const lowStock = getLowStockItems().map(product => ({
    name: product.name,
    meta: `${product.stock} left (reorder below ${product.lowStockThreshold})`,
    tag: 'LOW STOCK',
    tagClass: 'tag-low'
  }));

  const expiring = getExpiringSoonItems().map(product => ({
    name: product.name,
    meta: `Expires in ${daysUntil(product.expiryDate)} day(s) — ${product.expiryDate}`,
    tag: 'EXPIRING',
    tagClass: 'tag-expiry'
  }));

  const all = [...lowStock, ...expiring];

  alertsList.innerHTML = all.map(item => `
    <div class="alert-item">
      <div>
        <div class="alert-name">${escapeHtml(item.name)}</div>
        <div class="alert-meta">${escapeHtml(item.meta)}</div>
      </div>
      <span class="alert-tag ${item.tagClass}">${escapeHtml(item.tag)}</span>
    </div>
  `).join('') || '<p style="font-size:12.5px; color:var(--muted);">No alerts right now.</p>';
}

function renderDate() {
  const dateEl = document.getElementById('todayDate');
  if (!dateEl) return;

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = 'Welcome back — ' + today.toLocaleDateString('en-UG', options);
}

function renderNavBadge() {
  const badge = document.getElementById('navBadge');
  if (!badge) return;

  try {
    const orders = getJson(STORAGE_KEYS.orders, []);
    const pending = Array.isArray(orders) ? orders.filter(order => order.status === 'pending').length : 0;
    badge.textContent = pending > 0 ? String(pending) : '';
  } catch (error) {
    badge.textContent = '';
  }
}

function renderInventoryTable() {
  const inventoryTableBody = document.getElementById('inventoryTableBody');
  if (!inventoryTableBody) return;

  inventoryTableBody.innerHTML = state.products.map(product => {
    const remaining = Number(product.stock || 0);
    let status = 'Healthy';
    let statusClass = 'status-active';

    if (remaining <= Number(product.lowStockThreshold || 0)) {
      status = 'Low stock';
      statusClass = 'status-done';
    }

    if (remaining <= 0) {
      status = 'Out of stock';
      statusClass = 'status-done';
    }

    return `
      <tr>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(remaining)}</td>
        <td>${escapeHtml(product.lowStockThreshold)}</td>
        <td>${escapeHtml(product.expiryDate)}</td>
        <td><span class="status-pill ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

function populateProductSelect() {
  const stockProduct = document.getElementById('stockProduct');
  if (!stockProduct) return;

  stockProduct.innerHTML = state.products.map(product => `
    <option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} (${product.stock} units)</option>
  `).join('');
}

function renderCurrentUser() {
  const user = getActiveUser();
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('currentUserName');
  const userRole = document.getElementById('currentUserRole');

  if (!user) {
    if (userAvatar) userAvatar.textContent = '??';
    if (userName) userName.textContent = 'Not signed in';
    if (userRole) userRole.textContent = 'Access required';
    return;
  }

  const initials = user.fullName.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
  if (userAvatar) userAvatar.textContent = initials;
  if (userName) userName.textContent = user.fullName;
  if (userRole) userRole.textContent = user.role;
}

function clearMessage(elementId) {
  const msg = document.getElementById(elementId);
  if (msg) {
    msg.textContent = '';
    msg.classList.remove('error', 'success');
  }
}

function showMessage(elementId, message, type) {
  const msg = document.getElementById(elementId);
  if (!msg) return;
  msg.textContent = message;
  msg.classList.remove('error', 'success');
  if (type) msg.classList.add(type);
}

function showAuthScreen() {
  const appShell = document.getElementById('appShell');
  const authOverlay = document.getElementById('authOverlay');
  if (appShell) appShell.classList.add('hidden');
  if (authOverlay) authOverlay.classList.remove('hidden');
}

function showAppScreen() {
  const appShell = document.getElementById('appShell');
  const authOverlay = document.getElementById('authOverlay');
  if (appShell) appShell.classList.remove('hidden');
  if (authOverlay) authOverlay.classList.add('hidden');
}

function renderAll() {
  ensureSeedData();
  const activeUser = getActiveUser();
  if (!activeUser) {
    showAuthScreen();
    return;
  }

  showAppScreen();
  renderCurrentUser();
  renderDate();
  renderStatCards();
  renderRecentSales();
  renderAlerts();
  renderNavBadge();
  renderInventoryTable();
  populateProductSelect();
}

function loginUser(username, pin) {
  const trimmedUser = String(username || '').trim();
  const trimmedPin = String(pin || '').trim();
  const user = state.users.find(item => item.username.toLowerCase() === trimmedUser.toLowerCase() && item.pin === trimmedPin);

  if (!user) {
    showMessage('authError', 'Incorrect username or PIN. Please try again.', 'error');
    return;
  }

  setActiveUser(user);
  clearMessage('authError');
  renderAll();
}

function logoutUser() {
  setActiveUser(null);
  showAuthScreen();
}

function secureAction(promptText, callback) {
  const modal = document.getElementById('secureModal');
  const prompt = document.getElementById('securePrompt');
  const input = document.getElementById('confirmPassword');
  const error = document.getElementById('secureError');
  const form = document.getElementById('secureForm');

  if (prompt) prompt.textContent = promptText;
  if (input) input.value = '';
  if (error) error.textContent = '';

  state.pendingAction = callback;

  if (modal) modal.classList.remove('hidden');
  if (form) form.onsubmit = function (event) {
    event.preventDefault();
    const currentUser = getActiveUser();
    const enteredPassword = String(input.value || '').trim();
    const valid = currentUser && currentUser.password === enteredPassword;

    if (!valid) {
      if (error) error.textContent = 'Incorrect password. Please try again.';
      return;
    }

    if (modal) modal.classList.add('hidden');
    if (state.pendingAction) {
      state.pendingAction();
      state.pendingAction = null;
    }
  };
}

function createWorkerAccount(event) {
  event.preventDefault();
  const currentUser = getActiveUser();

  if (!currentUser || currentUser.role !== 'Owner') {
    showMessage('workerMessage', 'Only the owner can create worker credentials.', 'error');
    return;
  }

  const fullName = String(document.getElementById('workerName').value || '').trim();
  const username = String(document.getElementById('workerUsername').value || '').trim();
  const pin = String(document.getElementById('workerPin').value || '').trim();
  const password = String(document.getElementById('workerPassword').value || '').trim();

  if (!fullName || !username || !pin || !password) {
    showMessage('workerMessage', 'Please complete all worker details.', 'error');
    return;
  }

  if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
    showMessage('workerMessage', 'PIN must be 4 to 6 digits only.', 'error');
    return;
  }

  const existingUsername = state.users.some(user => user.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    showMessage('workerMessage', 'This username already exists. Please choose another one.', 'error');
    return;
  }

  secureAction('Create worker account? Enter your password to confirm.', () => {
    const worker = {
      id: `worker-${Date.now()}`,
      fullName,
      role: 'Worker',
      username,
      pin,
      password,
      isOwner: false
    };

    state.users.push(worker);
    saveJson(STORAGE_KEYS.users, state.users);

    document.getElementById('workerForm').reset();
    showMessage('workerMessage', `Worker account created for ${worker.fullName}.`, 'success');
  });
}

function submitStockAdjustment(event) {
  event.preventDefault();
  const currentUser = getActiveUser();
  if (!currentUser) return;

  const productId = document.getElementById('stockProduct').value;
  const qty = Number(document.getElementById('stockQty').value);
  const reason = document.getElementById('stockReason').value;
  const note = String(document.getElementById('stockNote').value || '').trim();

  if (!productId || Number.isNaN(qty) || qty === 0) {
    showMessage('stockMessage', 'Please select a product and enter a valid quantity change.', 'error');
    return;
  }

  const product = state.products.find(item => item.id === productId);
  if (!product) {
    showMessage('stockMessage', 'Selected product could not be found.', 'error');
    return;
  }

  const newStock = Number(product.stock || 0) + qty;
  if (newStock < 0) {
    showMessage('stockMessage', 'Stock cannot go below zero.', 'error');
    return;
  }

  secureAction('Confirm stock update. Enter your password to continue.', () => {
    product.stock = newStock;
    saveJson(STORAGE_KEYS.products, state.products);

    const summary = `${qty > 0 ? '+' : ''}${qty} ${product.name} • ${reason}${note ? ' — ' + note : ''}`;
    state.sales.unshift({
      product: product.name,
      customer: currentUser.fullName,
      qty: Math.abs(qty),
      amount: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    saveJson(STORAGE_KEYS.sales, state.sales);
    document.getElementById('stockAdjustForm').reset();
    showMessage('stockMessage', `Inventory updated successfully: ${summary}`, 'success');
    renderAll();
  });
}

function attachEventListeners() {
  const loginForm = document.getElementById('loginForm');
  const signOutBtn = document.getElementById('signOutBtn');
  const stockAdjustForm = document.getElementById('stockAdjustForm');
  const workerForm = document.getElementById('workerForm');
  const quickStockBtn = document.getElementById('quickStockBtn');
  const cancelConfirm = document.getElementById('cancelConfirm');

  if (loginForm) {
    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const pin = document.getElementById('loginPin').value;
      loginUser(username, pin);
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', logoutUser);
  }

  if (stockAdjustForm) {
    stockAdjustForm.addEventListener('submit', submitStockAdjustment);
  }

  if (workerForm) {
    workerForm.addEventListener('submit', createWorkerAccount);
  }

  if (quickStockBtn) {
    quickStockBtn.addEventListener('click', () => {
      const productSelect = document.getElementById('stockProduct');
      if (productSelect && productSelect.options.length) {
        productSelect.focus();
        productSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  if (cancelConfirm) {
    cancelConfirm.addEventListener('click', () => {
      document.getElementById('secureModal').classList.add('hidden');
      state.pendingAction = null;
    });
  }
}

function initApp() {
  ensureSeedData();
  attachEventListeners();
  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
