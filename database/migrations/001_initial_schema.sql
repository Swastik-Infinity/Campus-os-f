-- ==============================================================================
-- CampusOS v1.2 — Database Migration 001: Initial Schema
-- PostgreSQL 14+ / Supabase Compatible
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'staff', 'admin')),
    label VARCHAR(120) NOT NULL,
    department VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    roll_no VARCHAR(20) NOT NULL,
    division VARCHAR(20) NOT NULL,
    semester INT DEFAULT 5,
    allowance_days INT DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Maintenance Tickets (CampusFix)
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(30) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    owner_name VARCHAR(120) NOT NULL,
    assigned_to VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    affected_count INT DEFAULT 1 CHECK (affected_count >= 1),
    affected_by JSONB DEFAULT '[]'::jsonb,
    expected_hours INT DEFAULT 72 CHECK (expected_hours > 0),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Electrical', 'Plumbing', 'IT / Wifi', 'Furniture', 'Housekeeping', 'Other')),
    location VARCHAR(255) NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High')),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets(owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);

-- 4. Status History / Audit Trail for Tickets
CREATE TABLE IF NOT EXISTS ticket_status_history (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(30) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by VARCHAR(50) NOT NULL REFERENCES users(id),
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tsh_ticket_id ON ticket_status_history(ticket_id);

-- 5. Academic Attendance Settings
CREATE TABLE IF NOT EXISTS attendance_settings (
    department VARCHAR(100) PRIMARY KEY,
    threshold INT NOT NULL DEFAULT 75 CHECK (threshold >= 1 AND threshold <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Attendance Subjects
CREATE TABLE IF NOT EXISTS attendance_subjects (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    attended INT NOT NULL DEFAULT 0 CHECK (attended >= 0),
    total INT NOT NULL DEFAULT 0 CHECK (total >= 0),
    CONSTRAINT chk_att_leq_total CHECK (attended <= total),
    CONSTRAINT uq_student_subject UNIQUE (student_id, name)
);

CREATE INDEX IF NOT EXISTS idx_att_subj_student ON attendance_subjects(student_id);

-- 7. Attendance Daily History Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecture_date DATE NOT NULL,
    subject VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_att_logs_student ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_att_logs_date ON attendance_logs(lecture_date DESC);

-- 8. Leave Applications
CREATE TABLE IF NOT EXISTS leave_applications (
    id VARCHAR(30) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(120) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL DEFAULT 1 CHECK (days >= 1),
    reason TEXT NOT NULL,
    document VARCHAR(255) DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(50) REFERENCES users(id),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leaves_student ON leave_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leave_applications(status);

-- 9. Smart Notices
CREATE TABLE IF NOT EXISTS notices (
    id VARCHAR(30) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience VARCHAR(50) NOT NULL CHECK (audience IN ('ALL', 'CE-Student', 'Faculty', 'Staff')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Important')),
    expiry DATE NOT NULL,
    read_by JSONB DEFAULT '[]'::jsonb,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_notices_audience ON notices(audience);
CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices(priority);

-- 10. Student Administrative Service Requests
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(30) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(120) NOT NULL,
    service_type VARCHAR(120) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_student ON service_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON service_requests(status);

-- 11. Campus Equipment & Assets Register
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    location VARCHAR(150) NOT NULL,
    installed_date DATE NOT NULL,
    condition VARCHAR(50) NOT NULL DEFAULT 'Good',
    repairs INT NOT NULL DEFAULT 0 CHECK (repairs >= 0),
    complaints INT NOT NULL DEFAULT 0 CHECK (complaints >= 0),
    specs TEXT
);

CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

-- 12. Departmental Consumables Inventory
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INT NOT NULL DEFAULT 10 CHECK (min_stock >= 0),
    unit VARCHAR(30) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_dept ON inventory_items(department);

-- 13. User Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_module VARCHAR(50) DEFAULT 'dashboard',
    unread BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread ON notifications(user_id, unread);

-- 14. Audit Logs (Administrative Security)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
