-- ==============================================================================
-- CampusOS v1.2 — Database Seed 001: Initial Prototype Data
-- ==============================================================================

-- 1. Insert Users (Demo Persona Accounts + Student Roster)
-- Password for all demo accounts: demo123 (hashed with bcrypt 10 rounds)
INSERT INTO users (id, name, email, password_hash, role, label, department, avatar)
VALUES
('student-kiran', 'Kiran Patil', 'kiran.patil@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'student', 'Student · Computer Engineering', 'Computer Engineering', 'KP'),
('faculty-neha', 'Dr. Neha Kulkarni', 'neha.kulkarni@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'faculty', 'Faculty · Computer Engineering', 'Computer Engineering', 'NK'),
('staff-arun', 'Arun More', 'arun.more@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'staff', 'Maintenance Staff · Facilities', 'Facilities & Maintenance', 'AM'),
('admin-campus', 'Campus Administrator', 'admin@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'admin', 'Admin · Campus Operations', 'Executive Administration', 'CO'),
('student-aarav', 'Aarav Shah', 'aarav.shah@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'student', 'Student · Computer Engineering', 'Computer Engineering', 'AS'),
('student-sana', 'Sana Khan', 'sana.khan@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'student', 'Student · Computer Engineering', 'Computer Engineering', 'SK'),
('student-rohan', 'Rohan Mehta', 'rohan.mehta@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'student', 'Student · Computer Engineering', 'Computer Engineering', 'RM'),
('student-ananya', 'Ananya Iyer', 'ananya.iyer@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'student', 'Student · Computer Engineering', 'Computer Engineering', 'AI'),
('student-vikram', 'Vikram Deshmukh', 'vikram.deshmukh@campus.edu', '$2a$10$9u.5McsDhqeyLnLgnok7hexZsaOJRGqDVMwD8ef1v3K3SMCXEKDle', 'student', 'Student · Computer Engineering', 'Computer Engineering', 'VD')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    label = EXCLUDED.label,
    department = EXCLUDED.department,
    avatar = EXCLUDED.avatar;

-- 2. Student Profiles
INSERT INTO student_profiles (user_id, roll_no, division, semester, allowance_days)
VALUES
('student-kiran', '101', 'CE-A', 5, 12),
('student-aarav', '102', 'CE-A', 5, 12),
('student-sana', '103', 'CE-A', 5, 12),
('student-rohan', '104', 'CE-A', 5, 12),
('student-ananya', '105', 'CE-A', 5, 12),
('student-vikram', '106', 'CE-A', 5, 12)
ON CONFLICT (user_id) DO UPDATE SET
    roll_no = EXCLUDED.roll_no,
    division = EXCLUDED.division,
    semester = EXCLUDED.semester;

-- 3. Maintenance Tickets (CampusFix)
INSERT INTO tickets (id, owner_id, owner_name, assigned_to, affected_count, affected_by, expected_hours, title, category, location, urgency, description, status, created_at, resolved_at)
VALUES
('CF-1001', 'student-kiran', 'Kiran Patil', 'staff-arun', 1, '["student-kiran"]'::jsonb, 72, 'Ceiling fan not spinning', 'Electrical', 'Block A, Room 112', 'Medium', 'Fan makes clicking sound then cuts out after 2 minutes.', 'RESOLVED', NOW() - INTERVAL '9 days', NOW() - INTERVAL '6 days'),
('CF-1002', 'student-kiran', 'Kiran Patil', 'staff-arun', 14, '["student-kiran", "student-aarav"]'::jsonb, 24, 'Wi-Fi drops every evening', 'IT / Wifi', 'Hostel Block C, 3rd floor', 'High', 'Signal drops completely between 7 PM and 9 PM daily across the entire floor corridor.', 'IN_PROGRESS', NOW() - INTERVAL '3 days', NULL),
('CF-1003', 'student-aarav', 'Aarav Shah', 'staff-arun', 3, '["student-aarav"]'::jsonb, 24, 'Leaking washroom faucet', 'Plumbing', 'Block B, Ground floor washroom', 'High', 'Continuous leak causing water accumulation near entrance.', 'PENDING', NOW() - INTERVAL '1 day', NULL),
('CF-1004', 'student-sana', 'Sana Khan', 'staff-arun', 1, '["student-sana"]'::jsonb, 120, 'Broken terminal chair in CS Lab 2', 'Furniture', 'CS Lab 2', 'Low', 'Hydraulic lever broken and base wobbles dangerously.', 'RESOLVED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days'),
('CF-1005', 'student-kiran', 'Kiran Patil', 'staff-arun', 6, '["student-kiran"]'::jsonb, 72, 'Corridor lights flickering', 'Electrical', 'Block A, 2nd floor corridor', 'Medium', 'Two tube lights flicking constantly, causing severe glare outside faculty cabin.', 'PENDING', NOW() - INTERVAL '2 days', NULL),
('CF-1006', 'student-rohan', 'Rohan Mehta', 'staff-arun', 4, '["student-rohan"]'::jsonb, 120, 'Canteen dustbins overflowing', 'Housekeeping', 'Block C, near canteen', 'Low', 'Waste not cleared for 48 hours.', 'IN_PROGRESS', NOW() - INTERVAL '3 days', NULL),
('CF-1007', 'student-ananya', 'Ananya Iyer', 'staff-arun', 2, '["student-ananya"]'::jsonb, 24, 'Projector P-204 optical power failure', 'IT / Wifi', 'Block P, Room 204', 'High', 'Projector turns off automatically after 5 minutes of lecture.', 'RESOLVED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO UPDATE SET
    owner_id = EXCLUDED.owner_id,
    owner_name = EXCLUDED.owner_name,
    assigned_to = EXCLUDED.assigned_to,
    affected_count = EXCLUDED.affected_count,
    affected_by = EXCLUDED.affected_by,
    expected_hours = EXCLUDED.expected_hours,
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    location = EXCLUDED.location,
    urgency = EXCLUDED.urgency,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    created_at = EXCLUDED.created_at,
    resolved_at = EXCLUDED.resolved_at;

-- 4. Attendance Settings
INSERT INTO attendance_settings (department, threshold)
VALUES ('Computer Engineering', 75)
ON CONFLICT (department) DO UPDATE SET threshold = EXCLUDED.threshold;

-- 5. Attendance Subjects (For student-kiran)
INSERT INTO attendance_subjects (student_id, name, attended, total)
VALUES
('student-kiran', 'Data Structures', 18, 24),
('student-kiran', 'Engineering Mathematics', 20, 24),
('student-kiran', 'Database Systems', 15, 23),
('student-kiran', 'Computer Networks', 19, 22)
ON CONFLICT (student_id, name) DO UPDATE SET
    attended = EXCLUDED.attended,
    total = EXCLUDED.total;

-- 6. Attendance Logs
DELETE FROM attendance_logs WHERE student_id = 'student-kiran';
INSERT INTO attendance_logs (student_id, lecture_date, subject, status)
VALUES
('student-kiran', '2026-09-12', 'Data Structures', 'Present'),
('student-kiran', '2026-09-11', 'Database Systems', 'Absent'),
('student-kiran', '2026-09-10', 'Engineering Mathematics', 'Present'),
('student-kiran', '2026-09-09', 'Computer Networks', 'Present'),
('student-kiran', '2026-09-08', 'Database Systems', 'Absent');

-- 7. Leave Applications
INSERT INTO leave_applications (id, student_id, student_name, start_date, end_date, days, reason, document, status, notes)
VALUES
('LV-1001', 'student-kiran', 'Kiran Patil', '2026-09-16', '2026-09-17', 2, 'Participating in Smart India Hackathon zonal round', 'sih-nomination.pdf', 'PENDING', ''),
('LV-1002', 'student-aarav', 'Aarav Shah', '2026-09-10', '2026-09-10', 1, 'Medical appointment for dental extraction', 'medical-note.pdf', 'APPROVED', 'Approved by Dr. Neha Kulkarni'),
('LV-1003', 'student-sana', 'Sana Khan', '2026-09-18', '2026-09-19', 2, 'Family engagement outside city', '', 'CLARIFICATION', 'Please provide parent consent confirmation email.')
ON CONFLICT (id) DO UPDATE SET
    student_id = EXCLUDED.student_id,
    student_name = EXCLUDED.student_name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    days = EXCLUDED.days,
    reason = EXCLUDED.reason,
    document = EXCLUDED.document,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes;

-- 8. Smart Notices
INSERT INTO notices (id, title, content, audience, priority, expiry, read_by, created_at)
VALUES
('NT-1001', 'Internal Assessment Timetable — Semester 5', 'The Unit Test II schedule for Computer Engineering Division A has been published. Midterms begin from October 3rd. All students must maintain >= 75% attendance to qualify.', 'CE-Student', 'Important', '2026-10-10', '[]'::jsonb, '2026-09-12'),
('NT-1002', 'Central Library Extended Night Timings', 'In preparation for examinations, the central campus library and digital reading room will remain open until 11:30 PM starting next Monday.', 'ALL', 'Normal', '2026-10-30', '["student-kiran"]'::jsonb, '2026-09-10'),
('NT-1003', 'Smart Campus Wi-Fi Scheduled Maintenance', 'Hostel Block C and Seminar Halls will undergo core router firmware upgrades this Saturday between 1:00 AM and 5:00 AM. Intermittent connectivity expected.', 'ALL', 'Normal', '2026-09-20', '[]'::jsonb, '2026-09-14')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    audience = EXCLUDED.audience,
    priority = EXCLUDED.priority,
    expiry = EXCLUDED.expiry,
    read_by = EXCLUDED.read_by,
    created_at = EXCLUDED.created_at;

-- 9. Student Service Requests
INSERT INTO service_requests (id, student_id, student_name, service_type, details, status, request_date)
VALUES
('SR-1001', 'student-kiran', 'Kiran Patil', 'Bonafide Certificate', 'Required for state education scholarship application verification', 'IN_PROGRESS', '2026-09-12'),
('SR-1002', 'student-aarav', 'Aarav Shah', 'ID Card Replacement', 'Original RFID card lost during transit in campus bus', 'PENDING', '2026-09-13'),
('SR-1003', 'student-rohan', 'Rohan Mehta', 'Transcript Copy', 'Semester 1-4 verified grade transcript for internship', 'COMPLETED', '2026-09-08')
ON CONFLICT (id) DO UPDATE SET
    student_id = EXCLUDED.student_id,
    student_name = EXCLUDED.student_name,
    service_type = EXCLUDED.service_type,
    details = EXCLUDED.details,
    status = EXCLUDED.status,
    request_date = EXCLUDED.request_date;

-- 10. Assets Register
INSERT INTO assets (id, name, category, location, installed_date, condition, repairs, complaints, specs)
VALUES
('PR-204', 'Projector Epson P-204', 'AV Equipment', 'Block P, Room 204', '2022-06-10', 'Needs inspection', 4, 5, '3LCD 3600 Lumens Ceiling Mount'),
('PC-CS-17', 'Dell OptiPlex Workstation 17', 'Computer', 'CS Lab 2', '2023-01-15', 'Good', 1, 1, 'Intel Core i7, 16GB RAM, Ubuntu 22.04'),
('AC-H-03', 'BlueStar Split AC 2.0T', 'HVAC', 'Hostel Block C Corridor', '2021-04-20', 'Operational', 2, 2, 'Inverter 2-Ton 5 Star'),
('NET-SW-04', 'Cisco Catalyst 24-Port Switch', 'Networking', 'Server Rack 2, IT Dept', '2022-11-04', 'Good', 0, 1, 'Gigabit Managed PoE Switch')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    location = EXCLUDED.location,
    installed_date = EXCLUDED.installed_date,
    condition = EXCLUDED.condition,
    repairs = EXCLUDED.repairs,
    complaints = EXCLUDED.complaints,
    specs = EXCLUDED.specs;

-- 11. Department Inventory
INSERT INTO inventory_items (id, name, department, stock, min_stock, unit)
VALUES
('INV-101', 'A4 Printing Paper (Reams)', 'Administration', 12, 20, 'reams'),
('INV-102', 'Cat6 Network Cable (Meters)', 'IT Services', 85, 30, 'm'),
('INV-103', 'Dry-Erase Whiteboard Markers', 'Computer Engineering', 4, 12, 'boxes'),
('INV-104', 'Ceiling Fluorescent Tubes (T5)', 'Facilities', 6, 15, 'units'),
('INV-105', 'Hand Sanitizer Refills 5L', 'Housekeeping', 18, 10, 'cans')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    stock = EXCLUDED.stock,
    min_stock = EXCLUDED.min_stock,
    unit = EXCLUDED.unit;

-- 12. Notifications
DELETE FROM notifications;
INSERT INTO notifications (id, user_id, title, message, target_module, unread)
VALUES
('NOTIF-1', 'student-kiran', 'Attendance Alert in Database Systems', 'Current attendance is 65.2%, below the 75% threshold.', 'attendance', TRUE),
('NOTIF-2', 'student-kiran', 'CampusFix Ticket Update', 'Wi-Fi complaint CF-1002 status changed to In Progress.', 'campusfix', TRUE),
('NOTIF-3', 'student-kiran', 'Leave Application Status', 'Dr. Neha Kulkarni reviewed your medical leave application.', 'leave', FALSE);
