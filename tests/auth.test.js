/**
 * CampusOS v1.2 — Authentication & RBAC Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import db from '../database/db';

describe('Authentication & Session Management API', () => {
  beforeAll(async () => {
    process.env.FORCE_SQLITE_TEST = 'true';
    await db.initializeDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  it('TC-BE-01: Demo login as Student (student-kiran)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'student-kiran' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.name).toBe('Kiran Patil');
    expect(res.body.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('TC-BE-02: Demo login as Faculty (faculty-neha)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'faculty-neha' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('faculty');
    expect(res.body.user.name).toBe('Dr. Neha Kulkarni');
  });

  it('TC-BE-03: Demo login as Maintenance Staff (staff-arun)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'staff-arun' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('staff');
    expect(res.body.user.name).toBe('Arun More');
  });

  it('TC-BE-04: Demo login as Administrator (admin-campus)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'admin-campus' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  it('TC-BE-05: Reject invalid demo account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'nonexistent-user' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('TC-BE-06: Production email/password authentication', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'kiran.patil@campus.edu',
        password: 'demo123'
      });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Kiran Patil');
    expect(res.body.token).toBeDefined();
  });

  it('TC-BE-07: Reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'kiran.patil@campus.edu',
        password: 'wrong-password'
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('TC-BE-08: Get current user session via Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'student-kiran' });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('student-kiran');
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.permissions).toContain('campusfix');
  });

  it('TC-BE-09: Logout and clear session cookie', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ accountId: 'student-kiran' });

    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('TC-BE-10: Retrieve demo persona switcher list', async () => {
    const res = await request(app).get('/api/v1/auth/accounts');

    expect(res.status).toBe(200);
    expect(res.body.accounts.length).toBe(4);
    const roles = res.body.accounts.map(a => a.role);
    expect(roles).toEqual(['student', 'faculty', 'staff', 'admin']);
  });
});
