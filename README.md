# Healthcare Management Prototype

### A simple role‑based healthcare management system using Express, SQLite, and a static front‑end.  

## User Roles:
- DDHS (District Hospital/Administration):
  - Manages overall system operations.
  - Reviews and approves resource requests.
  - Monitors doctor attendance and performance.
- PHC (Primary Health Center):
  - Submits its own resource requests.
  - Manages and updates local attendance records.
  - Views resource requests from associated Sub-Centers.
- Sub-Center:
  - Submits resource requests for its local area.
  - Manages attendance for local doctors.

---

## Project Structure

```
healthcare-management/
├── Dockerfile
├── docker-compose.yml
├── migrate.js
├── reset-db.js
├── index.js
├── package.json
├── README.md
└── public/
    ├── index.html
    ├── doctor_attendance_form.html
    ├── phc_dashboard.html
    ├── ddhs_dashboard.html
    ├── script.js
    └── style.css

```

---

## Local Setup

## Docker to pull & run

  docker run -p 3000:3000 bpkk/healthcare‑app:latest

## 1. Clone the repo

   git clone https://github.com/kishore-2/Healthcare-System.git
   cd Healthcare-System

## 2. Install deps & Initialize the database

    npm install
    node migrate.js

## 3. This creates data.db and seeds:

    Users: kishore/123 (DDHS), phc1/123 (PHC), sub1/123 (Sub‑Center)

## 4. Inventory items:

### Run the server

    node index.js

### The API and front‑end will be available at
    http://localhost:8080

### Test via browser

- Login as each role, verify dashboards
- PHC/Sub‑Center can submit attendance and resource requests.
- DDHS can view/filter attendance, approve/reject requests (and on approval the inventory updates automatically).

---

## 4. To Reset the data.db for fresh start:

    node reset-db.js

---

## Detailed Working

### 1. User Authentication & Role Routing
1. **Login**  
   - User enters **username** & **password** on `/index.html`.  
   - Front‑end calls `POST /api/login` with `{ username, password }`.  
   - Server looks up `users` table in SQLite.  
   - If credentials match, response is `{ success: true, role: "<DDHS|PHC|Sub-Center>" }`.  
   - Front‑end saves `sessionStorage.role` and routes:
     - `DDHS` → `/ddhs_dashboard.html`
     - `PHC` or `Sub-Center` → `/phc_dashboard.html`

2. **Session Persistence**  
   - All front‑end pages read `sessionStorage.role`.  
   - If not present, they auto‑redirect back to `/index.html`.

### 2. PHC/Sub‑Center Workflows
1. **Submit Doctor Attendance**  
   - On `/doctor_attendance_form.html`, doctor enters **Name**, **ID**, **Status**.  
   - Clicking **Submit** POSTS to `/api/attendance` with payload `{ doctorName, doctorId, status }`.  
   - Server adds a row in `attendance` with a timestamp.  
   - User sees confirmation alert and can **Back to Dashboard** or **Logout**.

2. **View & Request Inventory**  
   - On `/phc_dashboard.html`, the page on load GETs `/api/inventory`.  
   - Inventory table is rendered from the JSON response.  
   - To request supplies:
     1. Enter **Item** and **Quantity**, click **Submit Request**.
     2. Front‑end POSTs to `/api/resource-requests` with `{ itemName, quantity, requester }`.
     3. Server adds a row to `resourceRequests` with `status: 'Pending'`.
     4. User sees “Request submitted” alert.

### 3. DDHS Workflows
1. **View & Filter Attendance**  
   - On `/ddhs_dashboard.html`, page on load (and on status filter change) GETs `/api/attendance?[status=P|AB|A]`.  
   - The table shows doctor records in descending order by `id`.

2. **View & Approve/Reject Resource Requests**  
   - Also GETs `/api/resource-requests` and displays all entries.  
   - Each row has **Approve** / **Reject** buttons.  
   - Clicking calls `POST /api/resource-requests/approve` with `{ id, approved: true|false }`.  
   - Server updates that row’s `status` accordingly.  
   - **If approved**, server also runs an `UPDATE inventory SET quantity = quantity + ? WHERE itemName = ?` **inside the same route**:
     - Finds matching inventory item; if none exists, you can extend the code to `INSERT` a new one.
     - Adds the approved quantity to the existing stock.

### 4. Database Migrations & Seed Data
- **`migrate.js`** runs once to:
  1. Create tables: `users`, `attendance`, `inventory`, `resourceRequests`.
  2. Seed default users (`kishore/123`, `phc1/123`, `sub1/123`) and initial inventory.
- **Resetting Data**  
  - For a fresh prototype run, you can delete `data.db` and re‑run:

    rm data.db
    node migrate.js

### 5. Bringing It All Together
1. **Start the App**  
   node migrate.js
   node index.js
