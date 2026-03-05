module.exports = {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  database: {
    url: process.env.DATABASE_URL
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  rateLimit: {
    max: 100,
    timeWindow: '15 minutes'
  }
};
