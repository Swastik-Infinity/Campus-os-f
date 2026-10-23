/**
 * CampusOS v1.2 — Zod Request Schemas
 */
const { z } = require('zod');

// --- Auth Schemas ---
const loginSchema = {
  body: z.object({
    email: z.string().email('Please provide a valid email address.'),
    password: z.string().min(1, 'Password is required.')
  })
};

const demoLoginSchema = {
  body: z.object({
    accountId: z.string().min(1, 'Demo account identifier is required.')
  })
};

// --- Tickets Schemas ---
const createTicketSchema = {
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long.'),
    category: z.enum(['Electrical', 'Plumbing', 'IT / Wifi', 'Furniture', 'Housekeeping', 'Other']),
    location: z.string().min(2, 'Location is required.'),
    urgency: z.enum(['Low', 'Medium', 'High']).default('Low'),
    desc: z.string().optional().default('')
  })
};

const updateTicketStatusSchema = {
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED'])
  })
};

const assignTicketSchema = {
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    staffId: z.string().nullable().optional()
  })
};

// --- Attendance Schemas ---
const rosterAttendanceSchema = {
  body: z.object({
    subject: z.string().min(1, 'Subject name is required.'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.'),
    records: z.array(z.object({
      studentId: z.string().min(1),
      status: z.enum(['Present', 'Absent'])
    })).min(1, 'At least one student record is required.')
  })
};

const updateThresholdSchema = {
  body: z.object({
    threshold: z.number().int().min(1).max(100)
  })
};

// --- Leave Schemas ---
const applyLeaveSchema = {
  body: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD.'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD.'),
    reason: z.string().min(5, 'Reason must be at least 5 characters long.'),
    document: z.string().optional().default('')
  }).refine(data => data.end >= data.start, {
    message: 'End date cannot be earlier than start date.',
    path: ['end']
  })
};

const updateLeaveStatusSchema = {
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CLARIFICATION']),
    notes: z.string().optional().default('')
  })
};

// --- Notice Schemas ---
const createNoticeSchema = {
  body: z.object({
    title: z.string().min(3, 'Notice headline is required.'),
    content: z.string().min(5, 'Notice content is required.'),
    audience: z.enum(['ALL', 'CE-Student', 'Faculty', 'Staff']),
    priority: z.enum(['Normal', 'Important']).default('Normal'),
    expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry must be YYYY-MM-DD.')
  })
};

// --- Service Schemas ---
const createServiceSchema = {
  body: z.object({
    type: z.string().min(2, 'Service type is required.'),
    details: z.string().min(5, 'Verification details are required.')
  })
};

const updateServiceStatusSchema = {
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
  })
};

// --- Inventory Schemas ---
const adjustInventorySchema = {
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    delta: z.number().int()
  })
};

module.exports = {
  loginSchema,
  demoLoginSchema,
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  rosterAttendanceSchema,
  updateThresholdSchema,
  applyLeaveSchema,
  updateLeaveStatusSchema,
  createNoticeSchema,
  createServiceSchema,
  updateServiceStatusSchema,
  adjustInventorySchema
};
