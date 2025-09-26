import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";
import { ensureDefaultApiKey } from "@/services/security.service";
import logger from "@/utils/logger";

/**
 * Database initialization script
 * This script initializes the database schema and creates all required tables
 */
async function initializeDatabase() {
  try {
    logger.info("🔄[init]: Starting database initialization...");

    // Test database connection
    logger.info("🔌[init]: Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error(
        "❌[init]: Database connection failed. Please check your database configuration."
      );
      process.exit(1);
    }

    logger.info("✅[init]: Database connection established");

    // Check if database is already initialized
    const isInitialized = await dbInit.isDatabaseInitialized();

    if (isInitialized) {
      logger.info("ℹ️[init]: Database is already initialized");

      // Ask user if they want to proceed anyway
      const args = process.argv.slice(2);
      if (!args.includes("--force")) {
        logger.info("💡[init]: Use --force flag to recreate tables");
        process.exit(0);
      }

      logger.info("🗑️[init]: Force flag detected, dropping existing tables...");
      await dbInit.dropAllTables();
    }

    // Initialize database
    logger.info("🔧[init]: Creating database tables...");

    await dbInit.initializeDatabase();
    // Ensure default API key is set
    await ensureDefaultApiKey();

    logger.info("✅[init]: Database initialization completed successfully!");
    logger.info(
      "🚀[init]: You can now start the application with 'npm run dev'"
    );
  } catch (error) {
    logger.error("❌[init]: Database initialization failed:", error);
    process.exit(1);
  } finally {
    // Close database connections
    try {
      await closePool();
      logger.info("🔌[init]: Database connections closed");
    } catch (error) {
      logger.error("⚠️[init]: Error closing database connections:", error);
    }
    process.exit(0);
  }
}

// Run the initialization
initializeDatabase();
