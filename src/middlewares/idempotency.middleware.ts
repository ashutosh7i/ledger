import { Request, Response, NextFunction } from "express";
import { hashRequestBody } from "@/utils/request-hash";
import { sha256 } from "@/utils/hash";
import { idempotencyService } from "@/services/idempotency.service";
import logger from "@/utils/logger";

// Simple idempotency using Idempotency-Key header; scoped by API key hash for multi-tenant isolation
export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const idempotencyKey = req.header("Idempotency-Key");
    // We scope keys by the authenticated API key if available, else by a default scope
    const apiKeyProvided = req.header("x-api-key") || "public";
    if (!idempotencyKey) {
      next();
      return;
    } // only enforce when provided

    const scopeHash = sha256(apiKeyProvided);
    const composed = `${scopeHash}:${idempotencyKey}`;
    const key_hash = sha256(composed);
    const request_hash = hashRequestBody(req.body || {});

    const existing = await idempotencyService.getIdempotencyByKeyHash(key_hash);
    if (existing) {
      if (existing.request_hash === request_hash) {
        // Return 200 with stored reference; actual response body is not stored here
        // In this implementation, we only short-circuit at controller after DB create detection
        (req as any).idempotency = { key_hash, existing };
        next();
        return;
      } else {
        logger.warn(
          `Idempotency key conflict for key ${idempotencyKey} with different request body`
        );
        res
          .status(409)
          .json({
            error: "Idempotency conflict: request body mismatch for same key",
          });
        return;
      }
    }

    await idempotencyService.createPendingIdempotency(key_hash, request_hash);
    (req as any).idempotency = { key_hash };
    next();
    return;
  } catch (err) {
    next(err);
    return;
  }
}
