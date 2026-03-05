require('dotenv').config();
const Fastify = require('fastify');
const config = require('./config/env');

function buildApp(options = {}) {
  const {
    enablePrisma = true,
    enableApiRoutes = true,
  } = options;

  const fastify = Fastify({ logger: true });

  fastify.register(require('@fastify/cors'), {
    origin: config.frontend.url || true,
    credentials: true,
  });

  fastify.register(require('@fastify/helmet'));

  fastify.register(require('@fastify/rate-limit'), {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  if (enablePrisma) {
    fastify.register(require('./plugins/prisma'));
  }

  fastify.register(require('./plugins/auth'));

  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  if (enableApiRoutes && enablePrisma) {
    fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
    fastify.register(require('./routes/books'), { prefix: '/api/books' });
    fastify.register(require('./routes/reviews'), { prefix: '/api' });
    fastify.register(require('./routes/users'), { prefix: '/api' });
  }

  return fastify;
}

module.exports = { buildApp };
