/**
 * CampusOS v1.2 — Role-Based Access Control (RBAC) & System Health Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import db from '../database/db';

describe('RBAC & System Health API', () => {
  let studentToken = '';
  let facultyToken = '';
  let staffToken = '';
  let adminToken = '';

  beforeAll(async () => {
    process.env.FORCE_SQLITE_TEST = 'true';
    await db.initializeDatabase();

    const sLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'student-kiran' });
    studentToken = sLogin.body.token;

    const fLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'faculty-neha' });
    facultyToken = fLogin.body.token;

    const stLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'staff-arun' });
    staffToken = stLogin.body.token;

    const aLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'admin-campus' });
    adminToken = aLogin.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  it('TC-BE-32: System health endpoint returns operational status', async () => {
    const res = await request(app).get('/api/v1/system/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('CampusOS');
    expect(res.body.database.status).toBe('connected');
  });

  it('TC-BE-33: RBAC — Student forbidden from viewing Assets Register', async () => {
    const res = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('TC-BE-34: RBAC — Staff permitted to view Assets Register', async () => {
    const res = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.assets.length).toBeGreaterThanOrEqual(4);
  });

  it('TC-BE-35: RBAC — Student forbidden from publishing official notices', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Announcement',
        content: 'This should be blocked',
        audience: 'ALL',
        priority: 'Normal',
        expiry: '2026-11-01'
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('TC-BE-36: RBAC — Admin permitted to publish notices', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Midterm Practical Exam Schedule',
        content: 'Computer Engineering Department laboratory practical exams commence next week.',
        audience: 'CE-Student',
        priority: 'Important',
        expiry: '2026-11-15'
      });

    expect(res.status).toBe(201);
    expect(res.body.notice.title).toBe('Midterm Practical Exam Schedule');
  });

  it('TC-BE-37: Admin reset demo database to clean initial state', async () => {
    const res = await request(app)
      .post('/api/v1/system/reset')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
