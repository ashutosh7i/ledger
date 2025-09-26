import { Request, Response, NextFunction } from "express";
import { query } from "@/services/database.service";
import logger from "@/utils/logger";

// GET /reports/trial-balance?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getTrialBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (!from || !to) {
      logger.warn(
        "[reports.controller]: Missing 'from' or 'to' query parameter"
      );
      res.status(400).json({ error: "from and to are required" });
      return;
    }

    const rows = await query<any[]>(
      `SELECT a.code, a.name,
              COALESCE(SUM(jl.debit_cents),0) AS debits,
              COALESCE(SUM(jl.credit_cents),0) AS credits
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jl.entry_id
       WHERE je.date BETWEEN ? AND ? OR je.id IS NULL
       GROUP BY a.id
       ORDER BY a.code ASC`,
      [from, to]
    );

    const accounts = rows.map((r) => ({
      code: r.code,
      name: r.name,
      debits: Number(r.debits || 0),
      credits: Number(r.credits || 0),
      balance: Number(r.debits || 0) - Number(r.credits || 0),
    }));

    const totals = accounts.reduce(
      (acc, a) => ({
        debits: acc.debits + a.debits,
        credits: acc.credits + a.credits,
      }),
      { debits: 0, credits: 0 }
    );

    res.json({ from, to, accounts, totals });
    return;
  } catch (err) {
    logger.error("[reports.controller]: Error generating trial balance", err);
    next(err);
    return;
  }
}
