import { Router } from "express";
import { apiKeyAuth } from "@/middlewares/auth.middleware";
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
} from "@/controllers/accounts.controller";

const router = Router();

// Protect write operations with API key; reads are public for now
router.get("/", listAccounts);
router.get("/:id", getAccount);
router.post("/", apiKeyAuth, createAccount);
router.put("/:id", apiKeyAuth, updateAccount);
router.delete("/:id", apiKeyAuth, deleteAccount);
router.get("/:code/balance", getAccountBalance);

export default router;
