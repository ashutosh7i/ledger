import { Router } from "express";
import { apiKeyAuth } from "@/middlewares/auth.middleware";
import { idempotencyMiddleware } from "@/middlewares/idempotency.middleware";
import { createJournalEntry } from "@/controllers/journal.controller";

const router = Router();

router.post("/entries", apiKeyAuth, idempotencyMiddleware, createJournalEntry);

export default router;
