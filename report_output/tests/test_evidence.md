# CampusOS v1.2 — Live System Test Execution Report

**Execution Date:** 2026-10-16  
**Test Environment:** MS Edge (Chromium Headless) / Localhost  
**Application Tested:** `campusos-v1.2.html` (Local Web Storage Prototype)  
**Total Tests Executed:** 27  
**Passed:** 26 | **Failed:** 1

| Test ID | Module | Action / Test Input | Expected Result | Observed Result | Status |
|---------|--------|---------------------|-----------------|-----------------|--------|
| TC-01A | Auth | Login as Student (Kiran Patil) | Current user is Kiran Patil (student) | Kiran Patil (student) | **PASSED** |
| TC-02 | Session | Session reload check | Session restored from localStorage ('student-kiran') | State: student-kiran, Stored: student-kiran | **PASSED** |
| TC-03A | RBAC | Student nav visibility | 6 modules allowed, no Assets/Inventory | ['Dashboard', 'CampusFix', 'Smart Attendance', 'Leave Management', 'Smart Notices', 'Service Centre'] | **PASSED** |
| TC-04 | Security/RBAC | Student direct switch to Assets | Access restricted toast shown, activeModule remains dashboard | Active: dashboard | **PASSED** |
| TC-01B | Auth | Login as Faculty (Dr. Neha Kulkarni) | Current user role is faculty | faculty | **PASSED** |
| TC-01C | Auth | Login as Staff (Arun More) | Current user role is staff | staff | **PASSED** |
| TC-01D | Auth | Login as Administrator | Current user role is admin | admin | **PASSED** |
| TC-05 | CampusFix | Submit empty ticket form | Field error classes added on title and location | Title err: True, Loc err: True | **PASSED** |
| TC-06 | CampusFix | Rule-based keyword suggestion | Suggests category 'IT / Wifi' or 'Electrical' and High urgency | Box active: True, Cat: IT / Wifi, Urg: High | **PASSED** |
| TC-07 | CampusFix | Duplicate location detection | Flags open ticket CF-1002 at Hostel Block C, 3rd floor | Warning present: True | **PASSED** |
| TC-08 | CampusFix | SLA display on ticket cards | Calculates elapsed vs expected SLA hours and displays badge | SLA rendered: True | **PASSED** |
| TC-09 | CampusFix | Endorse ticket CF-1003 | Affected count increments (4 -> 5) | Actual: 4 | **FAILED** |
| TC-10 | CampusFix | Admin update ticket status | Status updated to IN_PROGRESS | IN_PROGRESS | **PASSED** |
| TC-11 | CampusFix | Filter tickets by search 'faucet' | Returns only faucet ticket | Count rendered: 1 | **PASSED** |
| TC-12 | Attendance | Student attendance & risk calculation | Calculates aggregate attendance and identifies subjects below 75% | Overall: 78%, Risk count: 1 | **PASSED** |
| TC-14 | Attendance | Configure attendance threshold to 80% | Threshold updated in AppState and localStorage to 80% | Threshold: 80% | **PASSED** |
| TC-15 | Attendance | Faculty save roster attendance | Class lecture attendance saved, total lectures updated | New total: 26 | **PASSED** |
| TC-16 | Leave | Student submit leave application | New leave application placed at top with PENDING status | Selected for national level symposium paper presentation | **PASSED** |
| TC-17 | Leave | Faculty approve leave LV-6055 | Status becomes APPROVED with mentor remarks | APPROVED | **PASSED** |
| TC-18 | Notices | Toggle notice read status | User ID added to notice.readBy array | Read by: ['faculty-neha'] | **PASSED** |
| TC-19 | Services | Create student service request | New service request recorded | Count: 4 -> 5 | **PASSED** |
| TC-20 | Assets | View asset register | Displays equipment with condition & repair history | Asset count: 4 | **PASSED** |
| TC-21 | Inventory | Increment whiteboard markers stock by +5 | Stock increases (9 -> 14) | Actual: 14 | **PASSED** |
| TC-22 | Notifications | Toggle notification dropdown | Dropdown menu displays unread notifications | Dropdown show: True | **PASSED** |
| TC-24 | Security | HTML escaping function | Escapes HTML tags to prevent XSS injection | &lt;script&gt;alert(1)&lt;/script&gt;&lt;b&gt;bold&lt;/b&gt; | **PASSED** |
| TC-23A | System | Open Reset Demo Data modal | Displays irreversible reset warning confirmation dialog | Dialog open | **PASSED** |
| TC-25 | Responsive | Mobile viewport layout (375px) | Mobile hamburger button visible, layout stacks cleanly | Hamburger visible: True | **PASSED** |
