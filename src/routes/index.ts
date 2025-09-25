import { Router } from "express";
import accountsRouter from "@/routes/accounts.routes";
import journalRouter from "@/routes/journal.routes";

const api = Router();

api.use("/accounts", accountsRouter);
api.use("/journal", journalRouter);

export default api;
