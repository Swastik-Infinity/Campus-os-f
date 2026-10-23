/**
 * CampusOS v1.2 — Smart Attendance Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import db from '../database/db';

describe('Smart Attendance API', () => {
  let studentToken = '';
  let facultyToken = '';

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

  it('TC-BE-20: Student view personal subject attendance & risk data', async () => {
    const res = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.threshold).toBe(75);
    expect(res.body.subjects.length).toBe(4);
    expect(res.body.history.length).toBeGreaterThanOrEqual(5);

    const ds = res.body.subjects.find(s => s.name === 'Data Structures');
    expect(ds).toBeDefined();
    expect(ds.attended).toBe(18);
    expect(ds.total).toBe(24);
  });

  it('TC-BE-21: Faculty batch mark lecture attendance for roster', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/roster')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: 'Data Structures',
        date: '2026-10-23',
        records: [
          { studentId: 'student-kiran', status: 'Present' },
          { studentId: 'student-aarav', status: 'Present' },
          { studentId: 'student-sana', status: 'Absent' },
          { studentId: 'student-rohan', status: 'Present' },
          { studentId: 'student-ananya', status: 'Present' },
          { studentId: 'student-vikram', status: 'Absent' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.recordsProcessed).toBe(6);

    // Verify updated totals for student-kiran
    const checkRes = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${studentToken}`);

    const ds = checkRes.body.subjects.find(s => s.name === 'Data Structures');
    expect(ds.total).toBe(25);
    expect(ds.attended).toBe(19);
  });

  it('TC-BE-22: Student forbidden from marking roster attendance', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/roster')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subject: 'Data Structures',
        date: '2026-10-23',
        records: [{ studentId: 'student-kiran', status: 'Present' }]
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('TC-BE-23: Faculty update attendance threshold', async () => {
    const res = await request(app)
      .patch('/api/v1/attendance/threshold')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ threshold: 80 });

    expect(res.status).toBe(200);
    expect(res.body.threshold).toBe(80);

    // Restore to 75
    await request(app)
      .patch('/api/v1/attendance/threshold')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ threshold: 75 });
  });
});
