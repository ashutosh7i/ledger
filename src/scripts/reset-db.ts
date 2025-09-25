import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";

/**
 * Database reset script
 * This script drops all existing tables and recreates them
 */
async function resetDatabase() {
  try {
    console.log("🔄[reset]: Starting database reset...");

    // Test database connection
    console.log("🔌[reset]: Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error(
        "❌[reset]: Database connection failed. Please check your database configuration."
      );
      process.exit(1);
    }

    console.log("✅[reset]: Database connection established");

    // Drop all tables
    console.log("🗑️[reset]: Dropping all existing tables...");
    await dbInit.dropAllTables();

    // Recreate all tables
    console.log("🔧[reset]: Creating database tables...");
    await dbInit.initializeDatabase();

    console.log("✅[reset]: Database reset completed successfully!");
    console.log(
      "🚀[reset]: You can now start the application with 'npm run dev'"
    );
  } catch (error) {
    console.error("❌[reset]: Database reset failed:", error);
    process.exit(1);
  } finally {
    // Close database connections
    try {
      await closePool();
      console.log("🔌[reset]: Database connections closed");
    } catch (error) {
      console.error("⚠️[reset]: Error closing database connections:", error);
    }
    process.exit(0);
  }
}

// Run the reset
resetDatabase();
