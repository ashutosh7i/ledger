/**
 * Database Initialization Service - Functional Approach
 *
 * This module handles database schema creation and management for the ledger system.
 * It provides functions to create all required tables with proper relationships,
 * constraints, and indexes.
 */

import { execute, query } from "@/services/database.service";
import logger from "@/utils/logger";

// Initialize the database with all required tables
export async function initializeDatabase(): Promise<void> {
  logger.info("🔄[database]: Initializing database tables...");

  try {
    // Create tables in dependency order
    await createAccountsTable();
    await createJournalEntriesTable();
    await createJournalLinesTable();
    await createIdempotencyKeysTable();
    await createApiKeysTable();

    logger.info("✅[database]: Database initialization completed successfully");
  } catch (error) {
    logger.error("❌[database]: Database initialization failed:", error);
    throw error;
  }
}

// Create the accounts table
async function createAccountsTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_accounts_code (code),
      INDEX idx_accounts_type (type)
    ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await execute(sql);
  logger.info("✓ Accounts table created/verified");
}

// Create the journal_entries table
async function createJournalEntriesTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      narration TEXT NOT NULL,
      posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reverses_entry_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reverses_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
      INDEX idx_journal_entries_date (date),
      INDEX idx_journal_entries_reverses (reverses_entry_id)
    ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await execute(sql);
  logger.info("✓ Journal entries table created/verified");
}

// Create the journal_lines table with double-entry constraints
async function createJournalLinesTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS journal_lines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entry_id INT NOT NULL,
      account_id INT NOT NULL,
      debit_cents BIGINT NOT NULL DEFAULT 0,
      credit_cents BIGINT NOT NULL DEFAULT 0,
      line_index TINYINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      INDEX idx_journal_lines_entry (entry_id),
      INDEX idx_journal_lines_account (account_id),
      INDEX idx_journal_lines_account_entry (account_id, entry_id),
      CONSTRAINT chk_journal_lines_amounts CHECK (
        (debit_cents > 0 AND credit_cents = 0) OR 
        (credit_cents > 0 AND debit_cents = 0)
      )
    ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await execute(sql);
  logger.info("✓ Journal lines table created/verified");
}

// Create the idempotency_keys table for request deduplication
async function createIdempotencyKeysTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key_hash VARCHAR(64) NOT NULL PRIMARY KEY,
      request_hash VARCHAR(64) NOT NULL,
      entry_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL,
      INDEX idx_idempotency_expires (expires_at)
    ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await execute(sql);
  logger.info("✓ Idempotency keys table created/verified");
}

// Create the api_keys table for authentication
async function createApiKeysTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_hash VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      INDEX idx_api_keys_hash (key_hash),
      INDEX idx_api_keys_active (is_active)
    ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await execute(sql);
  logger.info("✓ API keys table created/verified");
}

// Drop all tables in correct order (for testing/reset)
export async function dropAllTables(): Promise<void> {
  logger.info("🗑️[database]: Dropping all tables...");

  // Order matters due to foreign key constraints
  const tables = [
    "journal_lines",
    "journal_entries",
    "idempotency_keys",
    "api_keys",
    "accounts",
  ];

  await execute("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of tables) {
    await execute(`DROP TABLE IF EXISTS ${table}`);
    logger.info(`✓ Dropped table: ${table}`);
  }

  await execute("SET FOREIGN_KEY_CHECKS = 1");
  logger.info("✅[database]: All tables dropped successfully");
}

// Check if all required tables exist
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const requiredTables = [
      "accounts",
      "journal_entries",
      "journal_lines",
      "idempotency_keys",
      "api_keys",
    ];

    for (const table of requiredTables) {
      const rows = await query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [table]
      );
      if (rows.length === 0) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Convenience object for organized imports
export const dbInit = {
  initializeDatabase,
  dropAllTables,
  isDatabaseInitialized,
} as const;

export default dbInit;
