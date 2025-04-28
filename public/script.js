// public/script.js

// Login
function login(){
  const role = document.getElementById('role').value;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if(!role||!username||!password){
    alert('Please fill all fields');
    return;
  }
  fetch('/api/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username,password})
  })
  .then(r=>r.json())
  .then(data=>{
    if(data.success){
      sessionStorage.setItem('role',data.role);
      sessionStorage.setItem('username',username);
      if(data.role==='DDHS') location.href='/ddhs_dashboard.html';
      else location.href='/phc_dashboard.html';
    } else {
      alert('Invalid credentials');
    }
  });
}

// Logout
function logout(){
  sessionStorage.clear();
  location.href='/';
}

// Submit attendance
function submitAttendance(){
  const doctorName = document.getElementById('doctorName').value;
  const doctorId   = document.getElementById('doctorId').value;
  const status     = document.getElementById('status').value;
  fetch('/api/attendance',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({doctorName,doctorId,status})
  })
  .then(()=>alert('Attendance submitted'))
  .then(()=>location.href='/phc_dashboard.html');
}

// PHC Dashboard logic
if(location.pathname.endsWith('phc_dashboard.html')){
  // load inventory
  fetch('/api/inventory')
    .then(r=>r.json())
    .then(rows=>{
      const tb = document.querySelector('#inventoryTable tbody');
      rows.forEach(r=> tb.insertAdjacentHTML('beforeend',
        `<tr><td>${r.itemName}</td><td>${r.quantity}</td></tr>`));
    });

  // submit resource request
  window.submitRequest = ()=>{
    const itemName = document.getElementById('reqItem').value.trim();
    const quantity = +document.getElementById('reqQty').value;
    const requester = sessionStorage.getItem('role');
    fetch('/api/resource-requests',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({itemName,quantity,requester})
    })
    .then(()=>alert('Request submitted'))
    .then(()=>location.reload());
  };
}

// DDHS Dashboard logic
if(location.pathname.endsWith('ddhs_dashboard.html')){
  // attendance view
  const loadAtt = ()=>{
    const status = document.getElementById('filterStatus').value;
    fetch('/api/attendance'+(status?`?status=${status}`:''))
      .then(r=>r.json())
      .then(rows=>{
        const tb = document.querySelector('#attendanceTable tbody');
        tb.innerHTML='';
        rows.forEach(r=> tb.insertAdjacentHTML('beforeend',
          `<tr><td>${r.doctorName}</td><td>${r.doctorId}</td><td>${r.status}</td><td>${r.timestamp}</td></tr>`));
      });
  };
  document.getElementById('filterStatus').addEventListener('change',loadAtt);
  loadAtt();

  // request approval + inventory deduction
  const loadReq = ()=>{
    fetch('/api/resource-requests')
      .then(r=>r.json())
      .then(rows=>{
        const tb = document.querySelector('#requestTable tbody');
        tb.innerHTML='';
        rows.forEach(r=> tb.insertAdjacentHTML('beforeend',
          `<tr>
            <td>${r.itemName}</td><td>${r.quantity}</td><td>${r.requester}</td>
            <td id="status-${r.id}">${r.status}</td>
            <td>
              <button onclick="updateReq(${r.id},true)">Approve</button>
              <button onclick="updateReq(${r.id},false)">Reject</button>
            </td>
          </tr>`));
      });
  };
  window.updateReq = (id,approved)=>{
    fetch('/api/resource-requests/approve',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({id,approved})
    })
    .then(()=>loadReq());
  };
  loadReq();
}
