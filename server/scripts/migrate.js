require('dotenv').config();
const dbMigration = require('../utils/dbMigration');

(async () => {
  try {
    console.log('⏳ Running migrations...');
    await dbMigration.resetDatabase(); // Optional: wipe before running
    await dbMigration.migrate();
    await dbMigration.seedTestData();
    console.log('✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
})();
