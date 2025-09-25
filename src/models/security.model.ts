import { RowDataPacket } from "mysql2/promise";

export interface ApiKeyRow extends RowDataPacket {
  id: number;
  key_hash: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface IdempotencyKeyRow extends RowDataPacket {
  key_hash: string;
  request_hash: string;
  entry_id: number | null;
  created_at: string;
  expires_at: string;
}
