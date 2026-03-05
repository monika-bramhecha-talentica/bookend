const fp = require('fastify-plugin');
const { PrismaClient } = require('@prisma/client');

async function prismaPlugin(fastify, options) {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  await prisma.$connect();

  // Make Prisma Client available through fastify.prisma
  fastify.decorate('prisma', prisma);

  // Shutdown hook
  fastify.addHook('onClose', async (fastify) => {
    await fastify.prisma.$disconnect();
  });
}

module.exports = fp(prismaPlugin, {
  name: 'prisma'
});
