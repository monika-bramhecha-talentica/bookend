#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkPostgreSQL() {
  try {
    // Try to connect to PostgreSQL
    execSync('psql -U postgres -c "SELECT 1;"', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function checkDatabaseExists() {
  try {
    execSync('psql -U postgres -lqt | cut -d \\| -f 1 | grep -qw bookreview', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function createDatabase() {
  try {
    console.log('📦 Creating database "bookreview"...');
    execSync('psql -U postgres -c "CREATE DATABASE bookreview;"', { stdio: 'inherit' });
    console.log('✅ Database created successfully!');
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('  1. Make sure PostgreSQL is running:');
    console.log('     brew services start postgresql@14');
    console.log('  2. Try creating the database manually:');
    console.log('     createdb bookreview');
    console.log('  3. Or connect with a different user:');
    console.log('     psql -U your_username -c "CREATE DATABASE bookreview;"');
    process.exit(1);
  }
}

async function dropDatabase() {
  try {
    console.log('🗑️  Dropping existing database...');
    execSync('psql -U postgres -c "DROP DATABASE IF EXISTS bookreview;"', { stdio: 'inherit' });
    console.log('✅ Database dropped successfully!');
  } catch (error) {
    console.error('❌ Failed to drop database:', error.message);
    process.exit(1);
  }
}

async function runMigrations() {
  try {
    console.log('🔄 Running Prisma migrations...');
    
    // Check if migrations directory exists
    const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsPath) || fs.readdirSync(migrationsPath).length === 0) {
      console.log('📝 No existing migrations found. Creating initial migration...');
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } else {
      console.log('📝 Applying existing migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    }
    
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    process.exit(1);
  }
}

async function generatePrismaClient() {
  try {
    console.log('🔧 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Prisma Client generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client:', error.message);
    process.exit(1);
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data...');
    const seedPath = path.join(__dirname, 'seed.js');
    if (fs.existsSync(seedPath)) {
      require(seedPath);
      // Give seed script time to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Database seeded successfully!');
    } else {
      console.log('⚠️  Seed script not found. Skipping seeding...');
    }
  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Book Review Platform - Database Setup\n');
  
  // Check if PostgreSQL is running
  const pgRunning = await checkPostgreSQL();
  if (!pgRunning) {
    console.log('❌ Cannot connect to PostgreSQL!');
    console.log('\n📝 Please ensure PostgreSQL is installed and running:');
    console.log('\nFor macOS:');
    console.log('  brew services start postgresql@14');
    console.log('\nFor Linux:');
    console.log('  sudo systemctl start postgresql');
    console.log('\nFor Windows:');
    console.log('  net start postgresql-x64-14');
    console.log('\nAlternatively, try using createdb command directly:');
    console.log('  createdb bookreview');
    console.log('\nThen run: npm run db:migrate');
    process.exit(1);
  }
  
  const dbExists = await checkDatabaseExists();
  
  if (dbExists) {
    console.log('⚠️  Database "bookreview" already exists!');
    const answer = await question('Do you want to drop and recreate it? (y/N): ');
    
    if (answer.toLowerCase() === 'y') {
      await dropDatabase();
      await createDatabase();
    } else {
      console.log('ℹ️  Using existing database...');
    }
  } else {
    await createDatabase();
  }
  
  await runMigrations();
  await generatePrismaClient();
  
  const seedAnswer = await question('\nDo you want to seed the database with sample data? (Y/n): ');
  if (seedAnswer.toLowerCase() !== 'n') {
    await seedDatabase();
  }
  
  console.log('\n🎉 Database setup completed successfully!');
  console.log('\nYou can now:');
  console.log('  • Run "npm run dev" to start the server');
  console.log('  • Run "npm run db:studio" to open Prisma Studio');
  console.log('  • Check DATABASE_SETUP.md for test credentials\n');
  
  rl.close();
}

main().catch(console.error);
