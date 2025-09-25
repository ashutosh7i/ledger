import { Router } from "express";
import { getTrialBalance } from "@/controllers/reports.controller";

const router = Router();

router.get("/trial-balance", getTrialBalance);

export default router;
