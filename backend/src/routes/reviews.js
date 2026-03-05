async function recalculateBookRating(prisma, bookId) {
  const [reviewCount, ratingStats] = await Promise.all([
    prisma.review.count({ where: { bookId } }),
    prisma.review.aggregate({
      where: { bookId },
      _avg: { rating: true },
    }),
  ]);

  await prisma.book.update({
    where: { id: bookId },
    data: {
      ratingsCount: reviewCount,
      averageRating: reviewCount > 0 ? ratingStats._avg.rating || 0 : 0,
    },
  });
}

async function reviewRoutes(fastify) {
  fastify.get('/books/:bookId/reviews', {
    schema: {
      params: {
        type: 'object',
        required: ['bookId'],
        properties: {
          bookId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { bookId } = request.params;
    const { page = 1, limit = 20 } = request.query;
    const skip = (page - 1) * limit;

    try {
      const existingBook = await fastify.prisma.book.findUnique({ where: { id: bookId } });
      if (!existingBook) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      const [reviews, total] = await Promise.all([
        fastify.prisma.review.findMany({
          where: { bookId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        }),
        fastify.prisma.review.count({ where: { bookId } }),
      ]);

      return reply.send({
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch reviews' });
    }
  });

  fastify.post('/books/:bookId/reviews', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['bookId'],
        properties: {
          bookId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['rating', 'title', 'content'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string', minLength: 1, maxLength: 120 },
          content: { type: 'string', minLength: 1, maxLength: 5000 },
          spoilerFlag: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { bookId } = request.params;
    const { rating, title, content, spoilerFlag = false } = request.body;

    try {
      const existingBook = await fastify.prisma.book.findUnique({ where: { id: bookId } });
      if (!existingBook) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      const review = await fastify.prisma.review.create({
        data: {
          bookId,
          userId: request.user.id,
          rating,
          title,
          content,
          spoilerFlag,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      await recalculateBookRating(fastify.prisma, bookId);

      return reply.code(201).send(review);
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'You have already reviewed this book' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create review' });
    }
  });

  fastify.put('/reviews/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string', minLength: 1, maxLength: 120 },
          content: { type: 'string', minLength: 1, maxLength: 5000 },
          spoilerFlag: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      const existingReview = await fastify.prisma.review.findUnique({ where: { id } });

      if (!existingReview) {
        return reply.code(404).send({ error: 'Review not found' });
      }

      if (existingReview.userId !== request.user.id) {
        return reply.code(403).send({ error: 'You can only edit your own review' });
      }

      const review = await fastify.prisma.review.update({
        where: { id },
        data: request.body,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      await recalculateBookRating(fastify.prisma, existingReview.bookId);

      return reply.send(review);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update review' });
    }
  });

  fastify.delete('/reviews/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      const existingReview = await fastify.prisma.review.findUnique({ where: { id } });

      if (!existingReview) {
        return reply.code(404).send({ error: 'Review not found' });
      }

      if (existingReview.userId !== request.user.id) {
        return reply.code(403).send({ error: 'You can only delete your own review' });
      }

      await fastify.prisma.review.delete({ where: { id } });
      await recalculateBookRating(fastify.prisma, existingReview.bookId);

      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete review' });
    }
  });
}

module.exports = reviewRoutes;
