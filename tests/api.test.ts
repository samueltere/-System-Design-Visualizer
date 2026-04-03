import request from 'supertest';
import { app } from '../server';

describe('API Endpoints', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('should return 503 for design if pool is not initialized', async () => {
    const res = await request(app).get('/api/design/some-id');
    // Since pool is null by default in tests without initDb()
    expect(res.statusCode).toEqual(503);
  });
});
