require('dotenv').config();
const snowflakeService = require('../services/snowflakeService');

class DbMigration {
  constructor() {
    this.migrations = [];
  }

  async tableExists(tableName) {
    const sql = `SHOW TABLES LIKE ?`;
    const result = await snowflakeService.executeQuery(sql, [tableName]);
    return result.rowCount > 0;
  }

  async createTableIfNotExists(tableName, createSql) {
    const exists = await this.tableExists(tableName);
    if (!exists) {
      await snowflakeService.executeQuery(createSql);
      console.log(`Table ${tableName} created.`);
    } else {
      console.log(`Table ${tableName} already exists.`);
    }
  }

  async dropTableIfExists(tableName) {
    const exists = await this.tableExists(tableName);
    if (exists) {
      await snowflakeService.executeQuery(`DROP TABLE ${tableName}`);
      console.log(`Table ${tableName} dropped.`);
    } else {
      console.log(`Table ${tableName} does not exist.`);
    }
  }

  async seedTestData() {
    // Example: Insert sample data into user_progress table
    const insertSql = `
      INSERT INTO user_progress (user_id, progress_date, progress_score)
      VALUES
        ('test-user-1', CURRENT_DATE(), 75),
        ('test-user-1', DATEADD(day, -7, CURRENT_DATE()), 65),
        ('test-user-2', CURRENT_DATE(), 80)
    `;
    await snowflakeService.executeQuery(insertSql);
    console.log('Test data seeded.');
  }

  async resetDatabase() {
    // Drop tables in reverse order of dependencies
    await this.dropTableIfExists('user_progress');
    await this.dropTableIfExists('language_usage');
    await this.dropTableIfExists('user_skill_gaps');
    await this.dropTableIfExists('learning_path_completions');
    console.log('Database reset complete.');
  }

  async migrate() {
    // Example migration: create tables if not exist
    await this.createTableIfNotExists('user_progress', `
      CREATE TABLE user_progress (
        user_id VARCHAR,
        progress_date DATE,
        progress_score NUMBER
      )
    `);

    await this.createTableIfNotExists('language_usage', `
      CREATE TABLE language_usage (
        language VARCHAR,
        usage_date DATE,
        quality_score NUMBER
      )
    `);

    await this.createTableIfNotExists('user_skill_gaps', `
      CREATE TABLE user_skill_gaps (
        user_id VARCHAR,
        skill_gaps ARRAY
      )
    `);

    await this.createTableIfNotExists('learning_path_completions', `
      CREATE TABLE learning_path_completions (
        user_id VARCHAR,
        completion_date DATE,
        completion_rate NUMBER
      )
    `);

    console.log('Migration complete.');
  }
}

module.exports = new DbMigration();
