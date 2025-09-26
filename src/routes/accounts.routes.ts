import { Router } from "express";
import {
  listAccounts,
  getAccount,
  createAccount,
  getAccountBalance,
} from "@/controllers/accounts.controller";
import { apiKeyAuth } from "@/middlewares/auth.middleware";

const router = Router();

// Protect write operations with API key; reads are public for now
router.get("/", listAccounts);
router.get("/:id", getAccount);
router.post("/", apiKeyAuth, createAccount);
router.get("/:code/balance", getAccountBalance);

export default router;
