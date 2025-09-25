import { Request, Response, NextFunction } from "express";
import { sha256 } from "@/utils/hash";
import { findWhere, updateWhere } from "@/repositories/base.repository";
import { ApiKeyRow } from "@/models/security.model";

// Simple API key auth using x-api-key header. We store only hash in DB.
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headerKey = req.header("x-api-key");
    if (!headerKey) {
      res.status(401).json({ error: "API key required" });
      return;
    }

    const keyHash = sha256(headerKey);
    const rows = await findWhere<ApiKeyRow>("api_keys", {
      key_hash: keyHash,
      is_active: 1,
    });
    const apiKey = rows[0];
    if (!apiKey) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    // Touch last_used_at (non-blocking)
    updateWhere(
      "api_keys",
      { last_used_at: new Date() },
      { key_hash: keyHash }
    ).catch(() => {});
    (req as any).apiKey = { id: apiKey.id, name: apiKey.name };
    next();
    return;
  } catch (err) {
    next(err);
    return;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({ error: err?.message || "Internal Server Error" });
}
