/**
 * CampusOS v1.2 — Leave Management Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import db from '../database/db';

describe('Leave Management API', () => {
  let studentToken = '';
  let facultyToken = '';
  let createdLeaveId = '';

  beforeAll(async () => {
    process.env.FORCE_SQLITE_TEST = 'true';
    await db.initializeDatabase();

    const sLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'student-kiran' });
    studentToken = sLogin.body.token;

    const fLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'faculty-neha' });
    facultyToken = fLogin.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  it('TC-BE-24: Student apply for academic leave', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        start: '2026-11-01',
        end: '2026-11-03',
        reason: 'Attending IEEE international research conference',
        document: 'ieee-invitation.pdf'
      });

    expect(res.status).toBe(201);
    expect(res.body.leave.id).toMatch(/^LV-\d{4}$/);
    expect(res.body.leave.days).toBe(3);
    expect(res.body.leave.status).toBe('PENDING');
    createdLeaveId = res.body.leave.id;
  });

  it('TC-BE-25: Reject leave application where end date is before start date', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        start: '2026-11-10',
        end: '2026-11-05',
        reason: 'Invalid date test'
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('TC-BE-26: Faculty review queue lists pending applications', async () => {
    const res = await request(app)
      .get('/api/v1/leaves')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.leaves.length).toBeGreaterThanOrEqual(3);
  });

  it('TC-BE-27: Faculty approve student leave with remarks', async () => {
    const res = await request(app)
      .patch(`/api/v1/leaves/${createdLeaveId}/status`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        status: 'APPROVED',
        notes: 'Approved for institutional representation.'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.notes).toContain('institutional representation');
  });

  it('TC-BE-28: Student forbidden from approving own leave', async () => {
    const res = await request(app)
      .patch(`/api/v1/leaves/${createdLeaveId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
