async function bookRoutes(fastify, options) {
  // Get all books with pagination and search
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          search: { type: 'string' },
          genre: { type: 'string' },
          author: { type: 'string' },
          sortBy: { type: 'string', enum: ['title', 'author', 'publishedYear', 'averageRating'], default: 'title' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
        }
      }
    }
  }, async (request, reply) => {
    const { page, limit, search, genre, author, sortBy, order } = request.query;
    const skip = (page - 1) * limit;

    try {
      const where = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (genre) where.genre = genre;
      if (author) where.author = { contains: author, mode: 'insensitive' };

      const [books, total] = await Promise.all([
        fastify.prisma.book.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: order },
          include: {
            _count: {
              select: { reviews: true }
            }
          }
        }),
        fastify.prisma.book.count({ where })
      ]);

      return reply.send({
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch books' });
    }
  });

  // Get single book by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const book = await fastify.prisma.book.findUnique({
        where: { id },
        include: {
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true
                }
              }
            }
          },
          _count: {
            select: { reviews: true }
          }
        }
      });

      if (!book) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      return reply.send(book);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch book' });
    }
  });

  // Create new book (admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      body: {
        type: 'object',
        required: ['isbn', 'title', 'author'],
        properties: {
          isbn: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          publisher: { type: 'string' },
          publishedYear: { type: 'integer' },
          genre: { type: 'string' },
          description: { type: 'string' },
          coverImageUrl: { type: 'string' },
          pageCount: { type: 'integer' },
          language: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const book = await fastify.prisma.book.create({
        data: request.body
      });

      return reply.code(201).send(book);
    } catch (error) {
      if (error.code === 'P2002') {
        return reply.code(400).send({ error: 'Book with this ISBN already exists' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create book' });
    }
  });

  // Update book (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          publisher: { type: 'string' },
          publishedYear: { type: 'integer' },
          genre: { type: 'string' },
          description: { type: 'string' },
          coverImageUrl: { type: 'string' },
          pageCount: { type: 'integer' },
          language: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      const book = await fastify.prisma.book.update({
        where: { id },
        data: request.body
      });

      return reply.send(book);
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Book not found' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update book' });
    }
  });

  // Delete book (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])]
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      await fastify.prisma.book.delete({
        where: { id }
      });

      return reply.code(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Book not found' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete book' });
    }
  });

  // Search books by ISBN (for adding reviews)
  fastify.get('/isbn/:isbn', async (request, reply) => {
    const { isbn } = request.params;

    try {
      const book = await fastify.prisma.book.findUnique({
        where: { isbn }
      });

      if (!book) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      return reply.send(book);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch book' });
    }
  });
}

module.exports = bookRoutes;
