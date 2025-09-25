import { config } from "@/configs/app.config";
import { sha256 } from "@/utils/hash";
import { findWhere, insert, updateWhere } from "@/repositories/base.repository";
import { ApiKeyRow } from "@/models/security.model";

export async function ensureDefaultApiKey(): Promise<void> {
  const key = config.apiKeys.defaultKey;
  const key_hash = sha256(key);
  const rows = await findWhere<ApiKeyRow>("api_keys", { key_hash });
  if (rows.length === 0) {
    await insert("api_keys", {
      key_hash,
      name: "default-dev-key",
      is_active: 1,
    });
  } else {
    const row = rows[0]!;
    if ((row.is_active as any) === 0) {
      await updateWhere("api_keys", { is_active: 1 }, { key_hash });
    }
  }
}

export const securityService = { ensureDefaultApiKey } as const;
