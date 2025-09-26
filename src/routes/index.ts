import { Router } from "express";
import accountsRouter from "@/routes/accounts.routes";
import journalRouter from "@/routes/journal.routes";
import reportsRouter from "@/routes/reports.routes";

const api = Router();

api.get("/", (_req, res) => {
  res.json({
    message: "Ledger System API v1",
  });
});

api.use("/accounts", accountsRouter);
api.use("/journal", journalRouter);
api.use("/reports", reportsRouter);

export default api;
