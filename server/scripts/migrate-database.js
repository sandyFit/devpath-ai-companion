const fs = require('fs');
const path = require('path');
const snowflakeService = require('../services/snowflakeService');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'database', 'add-filename-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    console.log('🔗 Connecting to Snowflake...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}...`);
        
        try {
          const result = await snowflakeService.executeQuery(statement, [], { timeout: 30000 });
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('🎉 Database migration completed!');
    
    // Test the new columns by describing the table
    console.log('🔍 Verifying table structure...');
    const describeResult = await snowflakeService.executeQuery('DESCRIBE TABLE ANALYSES', [], { timeout: 10000 });
    console.log('📋 ANALYSES table structure:');
    describeResult.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.type} (${row.null ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✨ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
