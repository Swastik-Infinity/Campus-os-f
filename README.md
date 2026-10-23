# CampusOS v1.2 — Smart Campus Operating System

> **Enterprise-grade, database-backed institutional operating system integrating facility ticketing, academic attendance, leave approvals, circular notices, and consumable inventory across Student, Faculty, Staff, and Administrator workflows.**

![CampusOS Banner](report_output/screenshots/01_login_screen.png)

---

## 1. Executive Summary & Architecture

CampusOS v1.2 transitions the institutional operating system frontend into a fully persistent, secure, multi-tier web application powered by **Node.js, Express.js, and PostgreSQL (with turnkey Supabase hosting)**, while preserving 100% of the existing single-page web user interface, CSS design tokens, typography, and responsive layouts.

### 🏛️ Four Institutional Roles
1. **🎓 Student (Kiran Patil - Computer Engineering Sem 5):**
   - AI-assisted facility incident reporting with automatic category and duplicate detection.
   - Community endorsement (*"I'm affected too"*) to accelerate response priority.
   - Real-time subject attendance tracking, risk counseling warnings, and 5-lecture forward projections.
   - Leave applications with document attachment and faculty review status.
   - Smart notices board with read/unread tracking.
   - Service Centre requests for Bonafide certificates, ID card reissues, and transcripts.
2. **👩‍🏫 Faculty (Dr. Neha Kulkarni - Associate Professor):**
   - High-velocity lecture attendance marking for student roster (`CE-A`).
   - Configurable institutional minimum attendance threshold (default: 75%).
   - Leave request review queue with instant approval, rejection, and clarification workflow.
   - Departmental lab incident and equipment disruption tracking.
3. **🔧 Maintenance Staff (Arun More - Facilities Technician):**
   - Assigned workorders queue with SLA countdown and breach alerts.
   - Processing lifecycle: `PENDING` ➔ `IN_PROGRESS` ➔ `RESOLVED`.
   - Asset register oversight with chronic failure pattern alerts (units with $\ge 4$ complaints).
   - Departmental consumables inventory with minimum safety buffer alerts and quick stock adjustments.
4. **🏛️ Administrator (Campus Operations):**
   - Executive operations command center with KPI metrics and SLA resolution compliance.
   - Incident distribution breakdown across Electrical, Plumbing, IT/Wi-Fi, Furniture, and Housekeeping.
   - Official notice composer with targeted audience broadcasting (`ALL`, `CE-Student`, `Faculty`, `Staff`).
   - Staff workorder allocation and ticket status assignment.
   - Student service requests queue with administrative status workflows.
   - Reversible demo data reset to restore clean factory state.

---

## 2. Technology Stack

- **Frontend:** HTML5, Modern Vanilla CSS3, Client-side JavaScript (ES2022+), Google Fonts (*Inter*, *Oswald*, *JetBrains Mono*).
- **Backend:** Node.js (v20+ / v24+), Express.js (v4.19+).
- **Database:** PostgreSQL (v14+ / Supabase compatible) with normalized schemas, foreign keys, constraints, and audit logging.
- **Relational Fallback:** Automated in-memory relational SQLite engine (`node:sqlite`) for offline development and instant zero-dependency test execution.
- **Security:** Helmet CSP security headers, CORS origin controls, Express rate-limiting, bcrypt password hashing (10 rounds), HttpOnly cookie and JWT Bearer token authentication, Zod schema validation.
- **Testing:** Vitest, Supertest, and Microsoft Playwright E2E browser automation in Microsoft Edge.

---

## 3. Database Architecture & Schema

The database schema is fully normalized and organized across 14 relational tables:

```
+--------------------+       +--------------------+       +--------------------+
|       users        |       |  student_profiles  |       |   audit_logs       |
|--------------------|       |--------------------|       |--------------------|
| id (PK)            |<------| user_id (PK, FK)   |       | id (PK, SERIAL)    |
| name               |       | roll_no            |       | user_id (FK)       |
| email (UNIQUE)     |       | division           |       | action             |
| password_hash      |       | semester           |       | details (JSONB)    |
| role               |       | allowance_days     |       | ip_address         |
| department         |       +--------------------+       | created_at         |
+--------------------+                                    +--------------------+
          |
          | 1:N
          +-------------------------------+--------------------------------+
          |                               |                                |
          v                               v                                v
+--------------------+       +-------------------------+       +--------------------+
|      tickets       |       |   leave_applications    |       |  service_requests  |
|--------------------|       |-------------------------|       |--------------------|
| id (PK, CF-xxxx)   |       | id (PK, LV-xxxx)        |       | id (PK, SR-xxxx)   |
| owner_id (FK)      |       | student_id (FK)         |       | student_id (FK)    |
| assigned_to (FK)   |       | start_date, end_date    |       | service_type       |
| title, category    |       | days, reason, document  |       | details, status    |
| location, urgency  |       | status, notes           |       | request_date       |
| status, hours_sla  |       +-------------------------+       +--------------------+
| created, resolved  |
+--------------------+
```

### Database Tables:
1. `users` — Authentication accounts and institutional persona roles.
2. `student_profiles` — Academic enrollment, roll number, division, semester.
3. `tickets` — CampusFix maintenance incidents with SLA metrics and endorsement counts.
4. `ticket_status_history` — Audit trail of ticket lifecycle transitions and notes.
5. `attendance_settings` — Departmental minimum attendance thresholds.
6. `attendance_subjects` — Student subject aggregates (attended vs. total lectures).
7. `attendance_logs` — Daily lecture attendance marking history.
8. `leave_applications` — Student leave requests, supporting documents, faculty decisions.
9. `notices` — Official circulars, target audience filtering, read receipts tracking.
10. `service_requests` — Administrative certificates and student credential reissues.
11. `assets` — Campus hardware registry, repair counts, and chronic failure alerts.
12. `inventory_items` — Departmental consumables, safety buffers, stock levels.
13. `notifications` — Role-targeted alerts and unread indicators.
14. `audit_logs` — Administrative security log for stock adjustments and system operations.

---

## 4. RESTful API Endpoints (`/api/v1`)

### Authentication & Sessions (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/demo-login` | Public | Instant prototype persona login (Student, Faculty, Staff, Admin) |
| `POST` | `/api/v1/auth/login` | Public | Production email/password authentication |
| `GET` | `/api/v1/auth/me` | Authenticated | Current user identity, role, and permission tokens |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clears session cookie and invalidates tokens |
| `GET` | `/api/v1/auth/accounts` | Public | Returns demo persona accounts for quick switching |
| `GET` | `/api/v1/auth/roster` | Authenticated | Enrolled student roster list for faculty attendance |

### CampusFix Ticketing (`/api/v1/tickets`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/tickets` | Authenticated | List tickets with `status`, `category`, `urgency`, and `query` filters |
| `GET` | `/api/v1/tickets/:id` | Authenticated | Ticket detail view with full status history timeline |
| `POST` | `/api/v1/tickets` | Student, Admin | File new facility incident with SLA target calculation |
| `PATCH` | `/api/v1/tickets/:id/status` | Staff, Admin | Transition ticket between `PENDING`, `IN_PROGRESS`, `RESOLVED` |
| `PATCH` | `/api/v1/tickets/:id/assign` | Admin | Assign maintenance technician to incident |
| `POST` | `/api/v1/tickets/:id/endorse`| Student | Community impact endorsement (*"I'm affected too"*) |

### Smart Attendance (`/api/v1/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/attendance` | Authenticated | Subject attendance totals, risk evaluation, and recent logs |
| `POST` | `/api/v1/attendance/roster` | Faculty, Admin | Batch mark lecture attendance for enrolled students |
| `PATCH` | `/api/v1/attendance/threshold`| Faculty, Admin| Reconfigure institutional warning threshold |

### Leave Management (`/api/v1/leaves`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/leaves` | Authenticated | Retrieve student leaves or faculty review queue |
| `GET` | `/api/v1/leaves/:id` | Authenticated | Leave application details drawer data |
| `POST` | `/api/v1/leaves` | Student | File leave application with date validation |
| `PATCH` | `/api/v1/leaves/:id/status` | Faculty, Admin | Approve, reject, or request clarification |

### Smart Notices (`/api/v1/notices`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/notices` | Authenticated | List circulars matching audience and priority |
| `POST` | `/api/v1/notices` | Admin | Publish official campus notice |
| `POST` | `/api/v1/notices/:id/toggle-read`| Student | Toggle read/unread state for active user |

### Student Services (`/api/v1/services`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/services` | Authenticated | List student requests or administrative queue |
| `POST` | `/api/v1/services` | Student | Request Bonafide certificate, ID replacement, transcript |
| `PATCH` | `/api/v1/services/:id/status` | Admin | Update processing status (`PENDING`, `IN_PROGRESS`, `COMPLETED`) |

### Assets & Inventory (`/api/v1/assets`, `/api/v1/inventory`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/assets` | Staff, Admin | Equipment register with health condition and chronic alerts |
| `GET` | `/api/v1/assets/:id` | Staff, Admin | Asset technical specifications and repair history |
| `GET` | `/api/v1/inventory` | Staff, Admin | Consumables stock levels and low-stock alerts |
| `PATCH` | `/api/v1/inventory/:id/adjust` | Staff, Admin | Adjust stock count ($\pm 1, +10$) with audit logging |

### System & Health (`/api/v1/system`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/system/health` | Public | Service health, database latency, active engine |
| `POST` | `/api/v1/system/reset` | Admin | Restore clean factory demo database state |

---

## 5. Local Setup & Quickstart

### Prerequisites
- Node.js (v20+ or v24+ recommended)
- npm (v10+ or v11+)
- Python 3.10+ (for running Playwright E2E browser tests)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
```
Default configuration works immediately out-of-the-box with built-in relational persistence.

### Step 3: Run Database Migrations & Seeds
```bash
# Run schema migrations
npm run migrate

# Run initial prototype seed data
npm run seed
```

### Step 4: Start Development Server
```bash
# Development mode with live file watching
npm run dev

# Production server
npm start
```
The server will start at: **`http://localhost:8080`**

---

## 6. Supabase / Hosted PostgreSQL Setup

To connect CampusOS to Supabase or any cloud-hosted PostgreSQL database:

1. **Create Supabase Project:**
   - Log into [supabase.com](https://supabase.com) and create a new project.
   - Obtain your database connection string under **Project Settings ➔ Database ➔ Connection string (URI)**.
   - Use the **Transaction Pooler** or **Session Pooler** (Port `6543` or `5432`).
2. **Configure `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   ```
3. **Execute Remote Migration & Seeding:**
   ```bash
   npm run migrate
   npm run seed
   ```
4. **Start the Application:**
   ```bash
   npm start
   ```
   CampusOS will automatically detect PostgreSQL and connect through connection pooling with SSL verification.

---

## 7. Automated Testing & Verification

CampusOS includes a complete test suite spanning backend unit tests, API integration tests, and Playwright browser regression tests.

### Run Backend Unit & Integration Tests (Vitest)
```bash
npm test
```
**Results:** **37 / 37 Tests Passed (100%)**
- Authentication and token lifecycle (TC-BE-01 to TC-BE-10)
- CampusFix ticket creation, validation, assignment, and endorsement (TC-BE-11 to TC-BE-19)
- Attendance calculation and roster batch marking (TC-BE-20 to TC-BE-23)
- Leave application and faculty approvals (TC-BE-24 to TC-BE-28)
- Department inventory and audit trails (TC-BE-29 to TC-BE-31)
- Strict server-side RBAC authorization (TC-BE-32 to TC-BE-37)

### Run Playwright End-to-End Browser Regression Tests (Edge)
```bash
# Ensure server is running on http://localhost:8080
python run_tests_and_capture.py
```
**Results:** **27 / 27 Tests Passed (100%)**
- All 21 genuine high-resolution screenshots captured in `report_output/screenshots/`.
- Zero visual or interaction regressions across Student, Faculty, Staff, and Admin roles.

---

## 8. Security Measures Implemented

1. **Zero Client Trust:** Browser role selection is never trusted for protected database mutations. Permissions are verified on the server via cryptographic JWT claims.
2. **SQL Injection Prevention:** 100% of database queries use parameterized SQL statements (`$1, $2`).
3. **Password Security:** Passwords hashed with bcrypt (10 rounds).
4. **Security Headers:** Helmet configured with strict Content Security Policy, XSS filtering, frame denial, and MIME sniffing protection.
5. **Rate Limiting:** Global rate limiting (200 requests / 15 min) and brute-force authentication protection (50 requests / 15 min).
6. **Input Sanitization:** Strict Zod schema validation across all request payloads and queries.

---

## 9. Default Demo Credentials

| Role | Persona Name | Demo Login ID | Email | Password |
|---|---|---|---|---|
| **Student** | Kiran Patil | `student-kiran` | `kiran.patil@campus.edu` | `demo123` |
| **Faculty** | Dr. Neha Kulkarni | `faculty-neha` | `neha.kulkarni@campus.edu` | `demo123` |
| **Staff** | Arun More | `staff-arun` | `arun.more@campus.edu` | `demo123` |
| **Administrator** | Campus Operations | `admin-campus` | `admin@campus.edu` | `demo123` |

---

## 10. License

Developed for the Institutional Smart Campus Operating System (MSBTE K-Scheme Diploma Project). Released under the MIT License.
