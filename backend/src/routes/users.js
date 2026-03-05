async function getOrCreateFavoritesList(prisma, userId) {
  const existing = await prisma.readingList.findFirst({
    where: {
      userId,
      name: 'Favorites',
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.readingList.create({
    data: {
      userId,
      name: 'Favorites',
      description: 'My favorite books',
      isPublic: false,
    },
  });
}

async function userRoutes(fastify) {
  fastify.get('/users/me/profile', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const [user, reviewCount, favoriteCount] = await Promise.all([
        fastify.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            bio: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
          },
        }),
        fastify.prisma.review.count({ where: { userId } }),
        fastify.prisma.readingListEntry.count({
          where: {
            readingList: {
              userId,
              name: 'Favorites',
            },
          },
        }),
      ]);

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({
        ...user,
        stats: {
          reviewCount,
          favoriteCount,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch profile' });
    }
  });

  fastify.get('/users/me/favorites', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const favoritesList = await fastify.prisma.readingList.findFirst({
        where: {
          userId,
          name: 'Favorites',
        },
      });

      if (!favoritesList) {
        return reply.send({ favorites: [] });
      }

      const entries = await fastify.prisma.readingListEntry.findMany({
        where: { readingListId: favoritesList.id },
        include: {
          book: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ favorites: entries.map((entry) => entry.book) });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch favorites' });
    }
  });

  fastify.post('/users/me/favorites/:bookId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['bookId'],
        properties: {
          bookId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { bookId } = request.params;

    try {
      const userId = request.user.id;

      const book = await fastify.prisma.book.findUnique({ where: { id: bookId } });
      if (!book) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      const favoritesList = await getOrCreateFavoritesList(fastify.prisma, userId);

      await fastify.prisma.readingListEntry.create({
        data: {
          readingListId: favoritesList.id,
          bookId,
          status: 'WANT_TO_READ',
        },
      });

      return reply.code(201).send({ message: 'Book added to favorites' });
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Book already in favorites' });
      }

      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to add favorite' });
    }
  });

  fastify.delete('/users/me/favorites/:bookId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['bookId'],
        properties: {
          bookId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { bookId } = request.params;

    try {
      const userId = request.user.id;

      const favoritesList = await fastify.prisma.readingList.findFirst({
        where: {
          userId,
          name: 'Favorites',
        },
      });

      if (!favoritesList) {
        return reply.code(404).send({ error: 'Favorites list not found' });
      }

      const favoriteEntry = await fastify.prisma.readingListEntry.findFirst({
        where: {
          readingListId: favoritesList.id,
          bookId,
        },
      });

      if (!favoriteEntry) {
        return reply.code(404).send({ error: 'Book is not in favorites' });
      }

      await fastify.prisma.readingListEntry.delete({
        where: { id: favoriteEntry.id },
      });

      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to remove favorite' });
    }
  });
}

module.exports = userRoutes;
