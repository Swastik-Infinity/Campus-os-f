/**
 * CampusOS v1.2 — Department Inventory & Consumables Tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import db from '../database/db';

describe('Department Inventory API', () => {
  let staffToken = '';
  let studentToken = '';

  beforeAll(async () => {
    process.env.FORCE_SQLITE_TEST = 'true';
    await db.initializeDatabase();

    const mLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'staff-arun' });
    staffToken = mLogin.body.token;

    const sLogin = await request(app).post('/api/v1/auth/demo-login').send({ accountId: 'student-kiran' });
    studentToken = sLogin.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  it('TC-BE-29: Staff retrieve inventory with low-stock flags', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.inventory.length).toBe(5);
    const lowStock = res.body.inventory.filter(i => i.stock < i.min);
    expect(lowStock.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-BE-30: Staff adjust inventory stock count (+5)', async () => {
    const res = await request(app)
      .patch('/api/v1/inventory/INV-103/adjust')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ delta: 5 });

    expect(res.status).toBe(200);
    expect(res.body.item.stock).toBe(9); // initial 4 + 5 = 9
  });

  it('TC-BE-31: Student forbidden from adjusting inventory', async () => {
    const res = await request(app)
      .patch('/api/v1/inventory/INV-103/adjust')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ delta: 10 });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
