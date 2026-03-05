const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');

async function authPlugin(fastify, options) {
  // Register JWT plugin
  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    sign: {
      expiresIn: '7d'
    }
  });

  // Decorate request with authentication method
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Optional authentication
  fastify.decorate('optionalAuthenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      // Don't throw error, just continue without user
      request.user = null;
    }
  });

  // Role-based authorization
  fastify.decorate('authorize', function(roles) {
    return async function(request, reply) {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      if (!roles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    };
  });

  // Generate tokens
  fastify.decorate('generateTokens', function(payload) {
    const accessToken = fastify.jwt.sign(payload, { expiresIn: '1h' });
    const refreshToken = fastify.jwt.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  });

  // Verify refresh token
  fastify.decorate('verifyRefreshToken', async function(token) {
    try {
      const decoded = fastify.jwt.verify(token);
      return decoded;
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  });
}

module.exports = fp(authPlugin, {
  name: 'auth'
});
