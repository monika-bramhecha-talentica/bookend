require('dotenv').config();
const config = require('./config/env');
const { buildApp } = require('./app');

const fastify = buildApp();

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: config.server.port || 3000,
      host: config.server.host || '0.0.0.0'
    });
    
    console.log(`🚀 Server running at http://localhost:${config.server.port || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📛 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();
