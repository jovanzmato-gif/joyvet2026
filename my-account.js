// JoyVet customer account: sign in, create an account, and show the account area.

const $ = id => document.getElementById(id);

async function api(url, method = 'GET', body = null) {
  try {
    const res = await fetch(url, { method, body });
    return await res.json();
  } catch (err) {
    console.error('Request failed:', url, err);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
}

function setMsg(id, text, ok) {
  const el = $(id);
  el.textContent = text;
  el.classList.remove('error', 'success');
  if (text) el.classList.add(ok ? 'success' : 'error');
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $('signinForm').classList.toggle('hidden', name !== 'signin');
  $('registerForm').classList.toggle('hidden', name !== 'register');
}

function showAccount(customer) {
  $('authCard').classList.add('hidden');
  $('accountCard').classList.remove('hidden');
  $('welcomeTitle').textContent = 'Welcome, ' + customer.fullName.split(' ')[0] + '!';
  $('welcomeSub').textContent = 'Choose what you would like to do.';

  // These pages are added in the next steps
  $('tileOrder').href = 'my-account-order.html';
  $('tileHistory').href = 'my-account-orders.html';
}

function showSignedOut() {
  $('accountCard').classList.add('hidden');
  $('authCard').classList.remove('hidden');
}

async function signIn(event) {
  event.preventDefault();
  $('siBtn').disabled = true;

  const body = new FormData();
  body.append('phone', $('siPhone').value.trim());
  body.append('password', $('siPassword').value);

  const result = await api('customer_login.php', 'POST', body);
  $('siBtn').disabled = false;

  if (!result.success) {
    setMsg('siMsg', result.message, false);
    return;
  }

  $('siPassword').value = '';
  setMsg('siMsg', '', true);
  showAccount(result.customer);
}

async function register(event) {
  event.preventDefault();
  $('regBtn').disabled = true;

  const body = new FormData();
  body.append('full_name', $('regName').value.trim());
  body.append('phone', $('regPhone').value.trim());
  body.append('password', $('regPassword').value);

  const result = await api('customer_register.php', 'POST', body);
  $('regBtn').disabled = false;

  if (!result.success) {
    setMsg('regMsg', result.message, false);
    return;
  }

  $('regPassword').value = '';
  setMsg('regMsg', '', true);
  showAccount(result.customer);
}

async function signOut() {
  await api('customer_logout.php', 'POST');
  showSignedOut();
  showTab('signin');
}

async function start() {
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => showTab(t.dataset.tab));
  });
  $('signinForm').addEventListener('submit', signIn);
  $('registerForm').addEventListener('submit', register);
  $('logoutBtn').addEventListener('click', signOut);

  // If a customer is already signed in, go straight to the account area
  const me = await api('customer_me.php');
  if (me.success) {
    showAccount(me.customer);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}