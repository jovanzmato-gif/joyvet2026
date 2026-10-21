// JoyVet staff: lists the team and their shift status; the owner can add workers.

let me = null;
let staff = [];

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function api(url, method = 'GET', body = null) {
  try {
    const res = await fetch(url, { method, body });
    return await res.json();
  } catch (err) {
    console.error('Request failed:', url, err);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
}

function showStatus(id, text, ok) {
  const el = $(id);
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (text) el.classList.add(ok ? 'success' : 'error');
}

function renderStaff() {
  const onShift = staff.filter(s => s.on_shift_since).length;
  $('staffCount').textContent = staff.length;
  $('onShiftCount').textContent = onShift;

  $('staffBody').innerHTML = staff.map(s => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.role)}</td>
      <td>${escapeHtml(s.username)}</td>
      <td>${s.on_shift_since
        ? `<span class="status-pill status-active">On shift since ${escapeHtml(s.on_shift_since)}</span>`
        : '<span class="status-pill status-done">Off shift</span>'}</td>
    </tr>`).join('') ||
    '<tr><td colspan="4">No staff members yet.</td></tr>';
}

async function loadStaff() {
  const data = await api('staff_json.php');
  if (!data || !Array.isArray(data.staff)) {
    $('staffBody').innerHTML = '<tr><td colspan="4">Could not load staff. Please refresh.</td></tr>';
    return;
  }

  staff = data.staff;
  const ownerView = data.isOwner;
  $('ownerPanel').classList.toggle('hidden', !ownerView);
  $('staffSub').textContent = ownerView
    ? 'Everyone on the team, and who is on shift now.'
    : 'Everyone on the team, and who is on shift now.';

  renderStaff();
}

async function addWorker(event) {
  event.preventDefault();

  const fullName = $('workerName').value.trim();
  const username = $('workerUsername').value.trim();
  const pin = $('workerPin').value.trim();
  const password = $('workerPassword').value.trim();
  const ownerPassword = $('ownerPassword').value;

  if (!fullName || !username || !pin || !password || !ownerPassword) {
    showStatus('workerMessage', 'Please complete all fields.', false);
    return;
  }

  const body = new FormData();
  body.append('full_name', fullName);
  body.append('username', username);
  body.append('pin', pin);
  body.append('worker_password', password);
  body.append('password', ownerPassword);

  const result = await api('create_worker.php', 'POST', body);
  showStatus('workerMessage', result.message, result.success);

  if (result.success) {
    $('workerForm').reset();
    await loadStaff();
  }
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const meResult = await api('me.php');

  if (!meResult.success) {
    $('staffGate').classList.remove('hidden');
    $('staffMain').classList.add('hidden');
    return;
  }

  $('staffGate').classList.add('hidden');
  $('staffMain').classList.remove('hidden');

  me = meResult.user;
  const initials = me.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.fullName;
  $('currentUserRole').textContent = me.role;

  $('workerForm').addEventListener('submit', addWorker);
  $('refreshBtn').addEventListener('click', loadStaff);
  $('signOutBtn').addEventListener('click', signOut);

  await loadStaff();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}