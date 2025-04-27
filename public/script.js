// public/script.js

// login function
function login(){
  const role = document.getElementById('role').value;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if(!role || !username || !password){
    alert('Please fill all fields');
    return;
  }
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  })
  .then(res => res.json())
  .then(data => {
    if(data.success){
      sessionStorage.setItem('role', data.role);
      sessionStorage.setItem('username', username);
      if(data.role === 'DDHS') {
        location.href = '/ddhs_dashboard.html';
      } else {
        location.href = '/phc_dashboard.html';
      }
    } else {
      alert('Invalid credentials');
    }
  })
  .catch(err => {
    console.error('Error during login:', err);
    alert('Error during login');
  });
}

// logout
function logout(){
  sessionStorage.clear();
  location.href = '/';
}

// attendance submission
function submitAttendance(){
  const doctorName = document.getElementById('doctorName').value.trim();
  const doctorId = document.getElementById('doctorId').value.trim();
  const status = document.getElementById('status').value;
  if(!doctorName || !doctorId || !status){
    alert('Please fill all fields');
    return;
  }
  fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorName, doctorId, status })
  })
  .then(res => res.json())
  .then(data => {
    if(data.success){
      alert('Attendance submitted');
      document.getElementById('doctorName').value = '';
      document.getElementById('doctorId').value = '';
      document.getElementById('status').value = '';
    } else {
      alert('Failed to submit attendance');
    }
  })
  .catch(err => {
    console.error('Error submitting attendance:', err);
    alert('Error submitting attendance');
  });
}

// PHC dashboard logic
if(location.pathname.endsWith('phc_dashboard.html')){
  // ensure authorized
  const role = sessionStorage.getItem('role');
  if(role !== 'PHC' && role !== 'Sub-Center'){
    alert('Unauthorized access');
    location.href = '/';
  }

  // load inventory
  fetch('/api/inventory')
    .then(res => res.json())
    .then(rows => {
      const tb = document.querySelector('#inventoryTable tbody');
      tb.innerHTML = '';
      rows.forEach(item => {
        tb.insertAdjacentHTML('beforeend',
          `<tr><td>${item.itemName}</td><td>${item.quantity}</td></tr>`
        );
      });
    })
    .catch(err => console.error('Error loading inventory:', err));

  // submit resource request
  window.submitRequest = () => {
    const itemName = document.getElementById('reqItem').value.trim();
    const quantity = +document.getElementById('reqQty').value;
    const requester = sessionStorage.getItem('role');
    if(!itemName || !quantity){
      alert('Please fill all fields');
      return;
    }
    fetch('/api/resource-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName, quantity, requester })
    })
    .then(res => res.json())
    .then(data => {
      if(data.success){
        alert('Request submitted');
        document.getElementById('reqItem').value = '';
        document.getElementById('reqQty').value = '';
      } else {
        alert('Failed to submit request');
      }
    })
    .catch(err => {
      console.error('Error submitting request:', err);
      alert('Error submitting request');
    });
  };
}

// DDHS dashboard logic
if(location.pathname.endsWith('ddhs_dashboard.html')){
  // ensure authorized
  if(sessionStorage.getItem('role') !== 'DDHS'){
    alert('Unauthorized access');
    location.href = '/';
  }

  // load attendance records
  const loadAtt = () => {
    const status = document.getElementById('filterStatus').value;
    const url = status ? `/api/attendance?status=${status}` : '/api/attendance';
    fetch(url)
      .then(res => res.json())
      .then(rows => {
        const tb = document.querySelector('#attendanceTable tbody');
        tb.innerHTML = '';
        rows.forEach(r => {
          tb.insertAdjacentHTML('beforeend',
            `<tr>
              <td>${r.doctorName}</td>
              <td>${r.doctorId}</td>
              <td>${r.status}</td>
              <td>${r.timestamp}</td>
            </tr>`
          );
        });
      })
      .catch(err => console.error('Error loading attendance:', err));
  };
  document.getElementById('filterStatus')
    .addEventListener('change', loadAtt);
  loadAtt();

  // load & manage resource requests
  const loadReq = () => {
    fetch('/api/resource-requests')
      .then(res => res.json())
      .then(rows => {
        const tb = document.querySelector('#requestTable tbody');
        tb.innerHTML = '';
        rows.forEach(r => {
          tb.insertAdjacentHTML('beforeend',
            `<tr>
              <td>${r.itemName}</td>
              <td>${r.quantity}</td>
              <td>${r.requester}</td>
              <td id="status-${r.id}">${r.status}</td>
              <td>
                <button onclick="updateReq(${r.id}, true)">Approve</button>
                <button onclick="updateReq(${r.id}, false)">Reject</button>
              </td>
            </tr>`
          );
        });
      })
      .catch(err => console.error('Error loading requests:', err));
  };
  window.updateReq = (id, approved) => {
    fetch('/api/resource-requests/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved })
    })
    .then(res => res.json())
    .then(data => {
      if(data.success){
        loadReq();
      } else {
        alert('Failed to update request');
      }
    })
    .catch(err => {
      console.error('Error updating request:', err);
      alert('Error updating request');
    });
  };
  loadReq();
}
