/**
 * Base Repository Functions - Functional Approach
 *
 * This module provides common database operations that can be used across
 * all entity repositories in the ledger system.
 *
 * Usage:
 * ```typescript
 * import { findById, insert, updateWhere } from '@/repositories/base.repository';
 *
 * const user = await findById<UserRow>('users', 123);
 * const result = await insert('users', { name: 'John', email: 'john@example.com' });
 * ```
 */

import { RowDataPacket, PoolConnection } from "mysql2/promise";
import { query, execute, transaction } from "@/services/database.service";

// Find a single record by ID
export async function findById<T extends RowDataPacket>(
  table: string,
  id: number | string,
  idColumn: string = "id"
): Promise<T | null> {
  const sql = `SELECT * FROM ${table} WHERE ${idColumn} = ? LIMIT 1`;
  const rows = await query<T[]>(sql, [id]);
  return rows[0] || null;
}

// Find records matching WHERE conditions
export async function findWhere<T extends RowDataPacket>(
  table: string,
  conditions: Record<string, any>,
  orderBy?: string,
  limit?: number
): Promise<T[]> {
  const whereClause = Object.keys(conditions)
    .map((key) => `${key} = ?`)
    .join(" AND ");

  const values = Object.values(conditions);

  let sql = `SELECT * FROM ${table} WHERE ${whereClause}`;

  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  return await query<T[]>(sql, values);
}

// Find all records from a table with optional ordering
export async function findAll<T extends RowDataPacket>(
  table: string,
  orderBy?: string,
  limit?: number
): Promise<T[]> {
  let sql = `SELECT * FROM ${table}`;

  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  return await query<T[]>(sql);
}

// Insert a new record
export async function insert(
  table: string,
  data: Record<string, any>
): Promise<{ insertId: number; affectedRows: number }> {
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = Object.values(data);

  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  const result = await execute(sql, values);

  return {
    insertId: result.insertId,
    affectedRows: result.affectedRows,
  };
}

// Insert multiple records in a single query
export async function insertMany(
  table: string,
  records: Record<string, any>[]
): Promise<{ insertId: number; affectedRows: number }> {
  if (records.length === 0) {
    throw new Error("Cannot insert empty records array");
  }

  const firstRecord = records[0]!;
  const columns = Object.keys(firstRecord).join(", ");
  const placeholders = records
    .map(
      () =>
        `(${Object.keys(firstRecord)
          .map(() => "?")
          .join(", ")})`
    )
    .join(", ");

  const values = records.flatMap((record) => Object.values(record));

  const sql = `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`;
  const result = await execute(sql, values);

  return {
    insertId: result.insertId,
    affectedRows: result.affectedRows,
  };
}

// Update records matching conditions
export async function updateWhere(
  table: string,
  data: Record<string, any>,
  conditions: Record<string, any>
): Promise<{ affectedRows: number; changedRows: number }> {
  const setClause = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");

  const whereClause = Object.keys(conditions)
    .map((key) => `${key} = ?`)
    .join(" AND ");

  const values = [...Object.values(data), ...Object.values(conditions)];

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  const result = await execute(sql, values);

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows || 0,
  };
}

// Update a single record by ID
export async function updateById(
  table: string,
  id: number | string,
  data: Record<string, any>,
  idColumn: string = "id"
): Promise<{ affectedRows: number; changedRows: number }> {
  return updateWhere(table, data, { [idColumn]: id });
}

// Delete records matching conditions
export async function deleteWhere(
  table: string,
  conditions: Record<string, any>
): Promise<{ affectedRows: number }> {
  const whereClause = Object.keys(conditions)
    .map((key) => `${key} = ?`)
    .join(" AND ");

  const values = Object.values(conditions);

  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const result = await execute(sql, values);

  return {
    affectedRows: result.affectedRows,
  };
}

// Delete a single record by ID
export async function deleteById(
  table: string,
  id: number | string,
  idColumn: string = "id"
): Promise<{ affectedRows: number }> {
  return deleteWhere(table, { [idColumn]: id });
}

// Check if record exists
export async function exists(
  table: string,
  conditions: Record<string, any>
): Promise<boolean> {
  const whereClause = Object.keys(conditions)
    .map((key) => `${key} = ?`)
    .join(" AND ");

  const values = Object.values(conditions);

  const sql = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
  const rows = await query(sql, values);

  return rows.length > 0;
}

// Count records
export async function count(
  table: string,
  conditions?: Record<string, any>
): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  let values: any[] = [];

  if (conditions && Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    sql += ` WHERE ${whereClause}`;
    values = Object.values(conditions);
  }

  const rows = await query<RowDataPacket[]>(sql, values);
  return rows[0]?.count || 0;
}

// Execute operations within a transaction
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  return await transaction(callback);
}

// Convenience object for organized imports (optional)
export const repository = {
  findById,
  findWhere,
  findAll,
  insert,
  insertMany,
  updateWhere,
  updateById,
  deleteWhere,
  deleteById,
  exists,
  count,
  withTransaction,
} as const;
