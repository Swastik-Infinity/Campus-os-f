/**
 * CampusOS v1.2 — CampusFix Tickets Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import db from '../database/db';

describe('CampusFix Tickets API', () => {
  let studentToken = '';
  let staffToken = '';
  let adminToken = '';
  let createdTicketId = '';

  beforeAll(async () => {
    process.env.FORCE_SQLITE_TEST = 'true';
    await db.initializeDatabase();

    const sLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'student-kiran' });
    studentToken = sLogin.body.token;

    const mLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'staff-arun' });
    staffToken = mLogin.body.token;

    const aLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'admin-campus' });
    adminToken = aLogin.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  it('TC-BE-11: List tickets with filter and SLA targets', async () => {
    const res = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBeGreaterThanOrEqual(7);
    const first = res.body.tickets[0];
    expect(first.id).toBeDefined();
    expect(first.status).toBeDefined();
    expect(first.expectedHours).toBeDefined();
  });

  it('TC-BE-12: Reject ticket creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('TC-BE-13: Student create new maintenance ticket', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Projector HDMI port damaged in Lab 3',
        category: 'IT / Wifi',
        location: 'CS Lab 3, 2nd floor',
        urgency: 'High',
        desc: 'Pins are bent and cable cannot be plugged in.'
      });

    expect(res.status).toBe(201);
    expect(res.body.ticket.id).toMatch(/^CF-\d{4}$/);
    expect(res.body.ticket.expectedHours).toBe(24);
    expect(res.body.ticket.status).toBe('PENDING');
    createdTicketId = res.body.ticket.id;
  });

  it('TC-BE-14: Staff update ticket status to IN_PROGRESS', async () => {
    const res = await request(app)
      .patch(`/api/v1/tickets/${createdTicketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('TC-BE-15: Student forbidden from directly modifying ticket status', async () => {
    const res = await request(app)
      .patch(`/api/v1/tickets/${createdTicketId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('TC-BE-16: Admin assign staff to ticket', async () => {
    const res = await request(app)
      .patch(`/api/v1/tickets/${createdTicketId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ staffId: 'staff-arun' });

    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBe('staff-arun');
  });

  it('TC-BE-17: Endorse existing ticket ("I\'m Affected Too")', async () => {
    // Login as a different student (Aarav)
    const aaravLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'student-aarav' });
    const aaravToken = aaravLogin.body.token;

    const res = await request(app)
      .post(`/api/v1/tickets/${createdTicketId}/endorse`)
      .set('Authorization', `Bearer ${aaravToken}`);

    expect(res.status).toBe(200);
    expect(res.body.affectedCount).toBe(2);
  });

  it('TC-BE-18: Reject duplicate endorsement from same student', async () => {
    const aaravLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'student-aarav' });
    const aaravToken = aaravLogin.body.token;

    const res = await request(app)
      .post(`/api/v1/tickets/${createdTicketId}/endorse`)
      .set('Authorization', `Bearer ${aaravToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ALREADY_ENDORSED');
  });

  it('TC-BE-19: Search tickets by location keyword', async () => {
    const res = await request(app)
      .get('/api/v1/tickets?query=corridor')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBeGreaterThanOrEqual(1);
    const hasCorridor = res.body.tickets.some(t => t.location.toLowerCase().includes('corridor'));
    expect(hasCorridor).toBe(true);
  });
});
