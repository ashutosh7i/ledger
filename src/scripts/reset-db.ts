import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";
import { ensureDefaultApiKey } from "@/services/security.service";
import logger from "@/utils/logger";

/**
 * Database reset script
 * This script drops all existing tables and recreates them
 */
async function resetDatabase() {
  try {
    logger.info("🔄[reset]: Starting database reset...");

    // Test database connection
    logger.info("🔌[reset]: Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error(
        "❌[reset]: Database connection failed. Please check your database configuration."
      );
      process.exit(1);
    }

    logger.info("✅[reset]: Database connection established");

    // Drop all tables
    logger.info("🗑️[reset]: Dropping all existing tables...");
    await dbInit.dropAllTables();

    // Recreate all tables
    logger.info("🔧[reset]: Creating database tables...");
    await dbInit.initializeDatabase();

    logger.info("✅[reset]: Database reset completed successfully!");
    logger.info(
      "🚀[reset]: You can now start the application with 'npm run dev'"
    );
    // Ensure default API key is set
    await ensureDefaultApiKey();
  } catch (error) {
    logger.error("❌[reset]: Database reset failed:", error);
    process.exit(1);
  } finally {
    // Close database connections
    try {
      await closePool();
      logger.info("🔌[reset]: Database connections closed");
    } catch (error) {
      logger.error("⚠️[reset]: Error closing database connections:", error);
    }
    process.exit(0);
  }
}

// Run the reset
resetDatabase();
