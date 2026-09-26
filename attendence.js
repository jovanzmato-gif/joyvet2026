const staffList = [
  {id:1, name:"Nabbosa Justine", role:"Sales Attendant", pin:"1234"},
  {id:2, name:"Kalema Brian",    role:"Sales Attendant", pin:"5678"},
  {id:3, name:"Auma Ritah",      role:"Store Assistant", pin:"9012"},
];

let attendanceLog = [
  {staffId:2, name:"Kalema Brian", role:"Sales Attendant", clockIn:"08:02 AM", clockOut:"01:15 PM", hours:"5.2", status:"done"},
];

let currentSession = null;

function populateStaffDropdown(){
  const select = document.getElementById('staffSelect');
  staffList.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });
}

function signIn(){
  const staffId = Number(document.getElementById('staffSelect').value);
  const pin = document.getElementById('pinInput').value.trim();
  const errorEl = document.getElementById('loginError');

  if(!staffId){ errorEl.textContent = "Please select your name."; return; }

  const staff = staffList.find(s => s.id === staffId);

  if(staff.pin !== pin){
    errorEl.textContent = "Incorrect PIN. Try again.";
    document.getElementById('pinInput').value = '';
    return;
  }
  errorEl.textContent = '';

  const existingRecord = attendanceLog.find(r => r.staffId === staffId && r.status === "active");

  if(existingRecord){
    currentSession = { staffId: staff.id, name: staff.name, role: staff.role, clockInTime: existingRecord.clockInTime };
  } else {
    const now = new Date();
    currentSession = { staffId: staff.id, name: staff.name, role: staff.role, clockInTime: now };
    attendanceLog.push({
      staffId: staff.id, name: staff.name, role: staff.role,
      clockInTime: now, clockIn: formatTime(now), clockOut: null, status: "active"
    });
  }
  showAttendanceView();
}

function signOut(){
  currentSession = null;
  switchUser();
}

function clockOut(){
  if(!currentSession) return;
  const now = new Date();
  const record = attendanceLog.find(r => r.staffId === currentSession.staffId && r.status === "active");
  if(record){
    record.clockOut = formatTime(now);
    record.status = "done";
    record.hours = calculateHours(currentSession.clockInTime, now);
  }
  currentSession = null;
  renderAttendanceTable();
  renderStats();
  switchUser();
}

function formatTime(date){ return date.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }); }
function calculateHours(start, end){ return ((end - start) / (1000*60*60)).toFixed(1); }
function todayLabel(){ return new Date().toLocaleDateString('en-UG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }

function renderAttendanceTable(){
  document.getElementById('attendanceBody').innerHTML = attendanceLog.map(r => `
    <tr>
      <td>${r.name}</td><td>${r.role}</td><td>${r.clockIn}</td><td>${r.clockOut || '—'}</td>
      <td>${r.hours ? r.hours + ' hrs' : '—'}</td>
      <td><span class="status-pill ${r.status === 'active' ? 'status-active' : 'status-done'}">${r.status === 'active' ? 'ON DUTY' : 'COMPLETE'}</span></td>
    </tr>
  `).join('');
}

function renderStats(){
  const onDuty = attendanceLog.filter(r => r.status === "active").length;
  const totalHoursToday = attendanceLog.filter(r => r.hours).reduce((sum, r) => sum + parseFloat(r.hours), 0).toFixed(1);
  const cards = [
    {icon:"🟢", label:"On Duty Now", num: onDuty},
    {icon:"👥", label:"Signed In Today", num: attendanceLog.length},
    {icon:"⏱️", label:"Total Hours Logged", num: totalHoursToday},
  ];
  document.getElementById('attendanceStats').innerHTML = cards.map(c => `
    <div class="stat-card"><div class="icon">${c.icon}</div><div class="num">${c.num}</div><div class="label">${c.label}</div></div>
  `).join('');
}

function showAttendanceView(){
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('attendanceView').classList.remove('hidden');
  document.getElementById('activeWorkerName').textContent = "👋 " + currentSession.name;
  document.getElementById('activeWorkerMeta').textContent = currentSession.role + " · Clocked in at " + formatTime(currentSession.clockInTime);
  document.getElementById('todayLabel').textContent = todayLabel();
  renderAttendanceTable();
  renderStats();
}

function switchUser(){
  document.getElementById('attendanceView').classList.add('hidden');
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('staffSelect').value = '';
  document.getElementById('pinInput').value = '';
  document.getElementById('loginError').textContent = '';
}

populateStaffDropdown();