import { db, runMigrations } from './schema';

/**
 * Migration script entry point
 * Run with: npm run migrate
 */
async function migrate() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    console.log('Starting database migration...');
    
    if (command === 'rollback') {
      console.log('Rollback not implemented for SQLite. Tables will remain.');
    } else {
      await runMigrations();
      console.log('Database migrations completed successfully.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

migrate();
