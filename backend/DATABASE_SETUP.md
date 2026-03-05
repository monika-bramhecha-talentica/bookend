# Database Setup Guide

## Prerequisites

Ensure PostgreSQL is installed and running:
```bash
# Check PostgreSQL status
psql --version

# For macOS (using Homebrew)
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql@14
```

## Quick Setup (Automated)

Run the automated setup script:
```bash
cd bookend/backend
npm install
npm run db:setup
```

This will:
1. Create the `bookreview` database
2. Run Prisma migrations
3. Generate Prisma client
4. Seed sample data (optional)

## Manual Setup (Step-by-Step)

### 1. Install Dependencies
```bash
cd bookend/backend
npm install
```

### 2. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bookreview;

# Exit psql
\q
```

### 3. Run Migrations
```bash
# Generate and apply migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 4. Seed Database (Optional)
```bash
npm run db:seed
```

### 5. Verify Setup
```bash
# Open Prisma Studio to view data
npm run db:studio
```

## Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Complete database setup (create, migrate, seed) |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Populate with sample data |
| `npm run db:reset` | Reset database (drops all data!) |
| `npm run db:studio` | Open Prisma Studio GUI |

## Test Credentials

After seeding, you can login with:

| User Type | Email | Password |
|-----------|-------|----------|
| Admin | admin@bookreview.com | password123 |
| User (Sarah) | sarah@example.com | password123 |
| User (Mike) | mike@example.com | password123 |

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@14
```

### Permission Denied
```bash
# Create user if needed
createuser -s postgres
```

### Database Already Exists
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS bookreview;"
psql -U postgres -c "CREATE DATABASE bookreview;"
```

## Next Steps

After database setup:
```bash
# Start the development server
npm run dev
```

Server will run at `http://localhost:3000`

Test the API:
```bash
# Health check
curl http://localhost:3000/health

# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "fullName": "Test User"
  }'
```
