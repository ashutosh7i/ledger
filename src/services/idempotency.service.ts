import {
  findWhere,
  insert,
  updateWhere,
  deleteWhere,
} from "@/repositories/base.repository";
import { IdempotencyKeyRow } from "@/models/security.model";

export async function getIdempotencyByKeyHash(key_hash: string) {
  const rows = await findWhere<IdempotencyKeyRow>("idempotency_keys", {
    key_hash,
  });
  const row = rows[0] || null;
  if (!row) return null;
  // TTL expiry check
  const expired =
    row.expires_at && new Date(row.expires_at).getTime() < Date.now();
  if (expired) {
    await deleteWhere("idempotency_keys", { key_hash });
    return null;
  }
  return row;
}

export async function createPendingIdempotency(
  key_hash: string,
  request_hash: string,
  ttlHours: number = 48
) {
  const expires_at = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await insert("idempotency_keys", {
    key_hash,
    request_hash,
    entry_id: null,
    expires_at,
  });
}

export async function markIdempotencySuccess(
  key_hash: string,
  entry_id: number
) {
  await updateWhere("idempotency_keys", { entry_id }, { key_hash });
}

export const idempotencyService = {
  getIdempotencyByKeyHash,
  createPendingIdempotency,
  markIdempotencySuccess,
} as const;
