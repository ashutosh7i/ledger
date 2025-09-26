import { config } from "@/configs/app.config";
import { sha256 } from "@/utils/hash";
import { execute } from "@/services/database.service";

export async function ensureDefaultApiKey(): Promise<void> {
  const key = config.apiKeys.defaultKey;
  const key_hash = sha256(key);
  // Upsert: Insert or update if key_hash already exists
  await execute(
    `INSERT INTO api_keys (key_hash, name, is_active)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = 1`,
    [key_hash, "default-dev-key"]
  );
}

export const securityService = { ensureDefaultApiKey } as const;
