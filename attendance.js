// JoyVet attendance: clock in and out, and show records from the attendence table.

let me = null;
let isOwner = false;
let myId = null;
let records = [];

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

function showMsg(text, ok) {
  const el = $('shiftMessage');
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (text) el.classList.add(ok ? 'success' : 'error');
}

function renderShift() {
  const mine = records.find(r => r.staff_id === myId && r.status === 'active');
  $('shiftStatus').textContent = mine
    ? `You are on shift since ${mine.clock_in}.`
    : 'You are not on shift.';
  $('clockInBtn').disabled = !!mine;
  $('clockOutBtn').disabled = !mine;
}

function renderRecords() {
  $('activeCount').textContent = records.filter(r => r.status === 'active').length;

  $('attBody').innerHTML = records.map(r => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.role)}</td>
      <td>${escapeHtml(r.clock_in)}</td>
      <td>${escapeHtml(r.clock_out || '—')}</td>
      <td>${escapeHtml(r.hours_worked === null ? '—' : r.hours_worked)}</td>
      <td><span class="status-pill ${r.status === 'active' ? 'status-active' : 'status-done'}">${escapeHtml(r.status === 'active' ? 'On shift' : 'Done')}</span></td>
    </tr>`).join('') ||
    '<tr><td colspan="6">No attendance records yet.</td></tr>';
}

async function loadRecords() {
  const data = await api('attendance_json.php');
  if (!data || !Array.isArray(data.records)) {
    $('attBody').innerHTML = '<tr><td colspan="6">Could not load records. Please refresh.</td></tr>';
    return;
  }

  isOwner = data.isOwner;
  myId = data.me;
  records = data.records;

  $('recordsTitle').textContent = isOwner ? 'Everyone\u2019s attendance' : 'My attendance';
  $('attSub').textContent = isOwner
    ? 'Owner view: recent shifts for every staff member.'
    : 'Your recent shifts.';

  renderRecords();
  renderShift();
}

async function clock(action) {
  const body = new FormData();
  body.append('action', action);

  const result = await api('attendance_action.php', 'POST', body);
  showMsg(result.message, result.success);

  if (result.success) {
    await loadRecords();
  }
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const meResult = await api('me.php');

  if (!meResult.success) {
    $('attGate').classList.remove('hidden');
    $('attMain').classList.add('hidden');
    return;
  }

  $('attGate').classList.add('hidden');
  $('attMain').classList.remove('hidden');

  me = meResult.user;
  const initials = me.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.fullName;
  $('currentUserRole').textContent = me.role;

  $('clockInBtn').addEventListener('click', () => clock('clock_in'));
  $('clockOutBtn').addEventListener('click', () => clock('clock_out'));
  $('refreshBtn').addEventListener('click', loadRecords);
  $('signOutBtn').addEventListener('click', signOut);

  await loadRecords();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}