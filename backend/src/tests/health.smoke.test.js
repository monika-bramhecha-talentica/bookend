const { buildApp } = require('../app');

describe('Health smoke test', () => {
  let app;

  beforeAll(async () => {
    app = buildApp({ enablePrisma: false, enableApiRoutes: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 from /health', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.status).toBe('ok');
    expect(typeof payload.timestamp).toBe('string');
  });
});
