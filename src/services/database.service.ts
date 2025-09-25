/**
 * Database Service - Functional Approach
 *
 * This module provides core database operations using MySQL connection pooling.
 * It offers a clean, functional API for executing queries, managing transactions,
 * and monitoring database health. All functions are stateless and use the
 * shared connection pool for optimal performance.
 */

import { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/configs/db.config";

// Get a connection from the pool
export async function getConnection(): Promise<PoolConnection> {
  return await pool.getConnection();
}

// Execute a SELECT query with type safety
export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

// Execute INSERT, UPDATE, DELETE queries
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

// Execute operations within a transaction
export async function transaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connectivity
export async function testConnection(): Promise<boolean> {
  try {
    await query("SELECT 1 as test");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// Get database information
export async function getDatabaseInfo(): Promise<{
  version: string;
  database: string;
  uptime: number;
}> {
  const versionResult = await query<RowDataPacket[]>(
    "SELECT VERSION() as version"
  );
  const dbResult = await query<RowDataPacket[]>(
    "SELECT DATABASE() as database_name"
  );
  const uptimeResult = await query<RowDataPacket[]>(
    "SHOW STATUS LIKE 'Uptime'"
  );

  return {
    version: versionResult?.[0]?.version || "Unknown",
    database: dbResult?.[0]?.database_name || "Unknown",
    uptime: parseInt(uptimeResult?.[0]?.Value || "0", 10),
  };
}

// Close the connection pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Get current pool status
export function getPoolStatus(): {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
} {
  return {
    totalConnections: (pool as any).pool?.config?.connectionLimit || 10,
    activeConnections: (pool as any).pool?.allConnections?.length || 0,
    idleConnections: (pool as any).pool?.freeConnections?.length || 0,
  };
}

// Convenience object for backward compatibility and organized imports
export const db = {
  query,
  execute,
  transaction,
  getConnection,
  testConnection,
  getDatabaseInfo,
  closePool,
  getPoolStatus,
} as const;

export default db;
