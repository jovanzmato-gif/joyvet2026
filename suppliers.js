// JoyVet suppliers: everyone can view; only the owner can add, edit or delete.

let isOwner = false;
let suppliers = [];

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
  const el = $('supMessage');
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (text) el.classList.add(ok ? 'success' : 'error');
}

function renderSuppliers() {
  $('supCount').textContent = suppliers.length;
  $('actionHead').classList.toggle('hidden', !isOwner);

  $('supBody').innerHTML = suppliers.map(s => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.phone || '—')}</td>
      <td>${escapeHtml(s.supplies || '—')}</td>
      ${isOwner ? `
      <td>
        <button class="btn-ghost btn-small" type="button" data-edit="${s.id}">Edit</button>
        <button class="btn-ghost btn-small" type="button" data-delete="${s.id}">Delete</button>
      </td>` : ''}
    </tr>`).join('') ||
    `<tr><td colspan="${isOwner ? 4 : 3}">No suppliers yet.</td></tr>`;
}

function resetForm() {
  $('supForm').reset();
  $('editId').value = '';
  $('formTitle').textContent = 'Add supplier';
  $('saveBtn').textContent = 'Save Supplier';
  $('cancelEditBtn').classList.add('hidden');
}

function startEdit(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  $('editId').value = s.id;
  $('supName').value = s.name;
  $('supPhone').value = s.phone || '';
  $('supSupplies').value = s.supplies || '';
  $('formTitle').textContent = 'Edit supplier';
  $('saveBtn').textContent = 'Save Changes';
  $('cancelEditBtn').classList.remove('hidden');
  $('supName').focus();
}

async function loadSuppliers() {
  const data = await api('suppliers_json.php');
  if (!data || !Array.isArray(data.suppliers)) {
    $('supBody').innerHTML = '<tr><td colspan="4">Could not load suppliers. Please refresh.</td></tr>';
    return;
  }

  isOwner = data.isOwner;
  suppliers = data.suppliers;
  $('ownerPanel').classList.toggle('hidden', !isOwner);
  $('supSub').textContent = isOwner
    ? 'Owner view: add, edit and remove suppliers.'
    : 'Suppliers and what they supply.';

  renderSuppliers();
}

async function saveSupplier(event) {
  event.preventDefault();

  const editId = $('editId').value;
  const body = new FormData();
  body.append('action', editId ? 'edit' : 'add');
  body.append('supplier_id', editId);
  body.append('name', $('supName').value.trim());
  body.append('phone', $('supPhone').value.trim());
  body.append('supplies', $('supSupplies').value.trim());
  body.append('password', $('ownerPassword').value);

  const result = await api('suppliers_action.php', 'POST', body);
  showMsg(result.message, result.success);

  if (result.success) {
    $('ownerPassword').value = '';
    resetForm();
    await loadSuppliers();
  }
}

async function deleteSupplier(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;

  const password = prompt(`Delete ${s.name}? Enter your password to confirm.`);
  if (password === null) return;

  const body = new FormData();
  body.append('action', 'delete');
  body.append('supplier_id', id);
  body.append('password', password);

  const result = await api('suppliers_action.php', 'POST', body);
  showMsg(result.message, result.success);
  await loadSuppliers();
}

async function signOut() {
  await api('logout.php', 'POST');
  window.location.href = 'index.html';
}

async function start() {
  const me = await api('me.php');

  if (!me.success) {
    $('supGate').classList.remove('hidden');
    $('supMain').classList.add('hidden');
    return;
  }

  $('supGate').classList.add('hidden');
  $('supMain').classList.remove('hidden');

  const initials = me.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  $('userAvatar').textContent = initials;
  $('currentUserName').textContent = me.user.fullName;
  $('currentUserRole').textContent = me.user.role;

  $('supForm').addEventListener('submit', saveSupplier);
  $('cancelEditBtn').addEventListener('click', resetForm);
  $('refreshBtn').addEventListener('click', loadSuppliers);
  $('signOutBtn').addEventListener('click', signOut);

  $('supBody').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (editBtn) startEdit(Number(editBtn.dataset.edit));
    if (delBtn) deleteSupplier(Number(delBtn.dataset.delete));
  });

  await loadSuppliers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}