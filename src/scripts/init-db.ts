import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";

/**
 * Database initialization script
 * This script initializes the database schema and creates all required tables
 */
async function initializeDatabase() {
  try {
    console.log("🔄[init]: Starting database initialization...");

    // Test database connection
    console.log("🔌[init]: Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error(
        "❌[init]: Database connection failed. Please check your database configuration."
      );
      process.exit(1);
    }

    console.log("✅[init]: Database connection established");

    // Check if database is already initialized
    const isInitialized = await dbInit.isDatabaseInitialized();

    if (isInitialized) {
      console.log("ℹ️[init]: Database is already initialized");

      // Ask user if they want to proceed anyway
      const args = process.argv.slice(2);
      if (!args.includes("--force")) {
        console.log("💡[init]: Use --force flag to recreate tables");
        process.exit(0);
      }

      console.log("🗑️[init]: Force flag detected, dropping existing tables...");
      await dbInit.dropAllTables();
    }

    // Initialize database
    console.log("🔧[init]: Creating database tables...");
    await dbInit.initializeDatabase();

    console.log("✅[init]: Database initialization completed successfully!");
    console.log(
      "🚀[init]: You can now start the application with 'npm run dev'"
    );
  } catch (error) {
    console.error("❌[init]: Database initialization failed:", error);
    process.exit(1);
  } finally {
    // Close database connections
    try {
      await closePool();
      console.log("🔌[init]: Database connections closed");
    } catch (error) {
      console.error("⚠️[init]: Error closing database connections:", error);
    }
    process.exit(0);
  }
}

// Run the initialization
initializeDatabase();
