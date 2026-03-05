const bcrypt = require('bcryptjs');

async function authRoutes(fastify, options) {
  // Register route
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'username'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          username: { type: 'string', minLength: 3 },
          fullName: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, username, fullName } = request.body;

    try {
      // Check if user exists
      const existingUser = await fastify.prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return reply.code(400).send({ 
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await fastify.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName: fullName || username
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true
        }
      });

      // Generate tokens
      const tokens = fastify.generateTokens({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });

      return reply.code(201).send({
        user,
        ...tokens
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  // Login route
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    try {
      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const tokens = fastify.generateTokens({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        user: userWithoutPassword,
        ...tokens
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          bio: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              reviews: true,
              followers: true,
              following: true
            }
          }
        }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send(user);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch user' });
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { refreshToken } = request.body;

    try {
      const decoded = await fastify.verifyRefreshToken(refreshToken);
      
      // Generate new tokens
      const tokens = fastify.generateTokens({ 
        id: decoded.id, 
        email: decoded.email,
        role: decoded.role 
      });

      return reply.send(tokens);
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout (optional - mainly for client-side token removal)
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    // In a real app, you might want to blacklist the token
    return reply.send({ message: 'Logged out successfully' });
  });
}

module.exports = authRoutes;
