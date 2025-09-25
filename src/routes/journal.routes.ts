import { Router } from "express";
import { apiKeyAuth } from "@/middlewares/auth.middleware";
import { idempotencyMiddleware } from "@/middlewares/idempotency.middleware";
import {
  createJournalEntry,
  getJournalEntry,
} from "@/controllers/journal.controller";

const router = Router();

router.post("/entries", apiKeyAuth, idempotencyMiddleware, createJournalEntry);
// Assignment path alias
router.post(
  "/journal-entries",
  apiKeyAuth,
  idempotencyMiddleware,
  createJournalEntry
);
router.get("/journal-entries/:id", getJournalEntry);

export default router;
