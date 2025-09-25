import { Request, Response, NextFunction } from "express";
import { CreateJournalEntryDTO, JournalEntryRow } from "@/models/journal.model";
import { AccountRow } from "@/models/account.model";
import {
  withTransaction,
  insert,
  findById,
  findWhere,
} from "@/repositories/base.repository";
import { idempotencyService } from "@/services/idempotency.service";
import { query } from "@/services/database.service";

export async function createJournalEntry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload: CreateJournalEntryDTO = req.body;
    if (
      !payload?.date ||
      !payload?.narration ||
      !Array.isArray(payload?.lines) ||
      payload.lines.length < 2
    ) {
      res
        .status(400)
        .json({ error: "date, narration and at least 2 lines are required" });
      return;
    }
    // Validate lines;
    let debitSum = 0;
    let creditSum = 0;
    const today = new Date();
    const date = new Date(payload.date);
    if (Number.isNaN(date.getTime()) || date > today) {
      res.status(400).json({ error: "Invalid or future date is not allowed" });
      return;
    }

    // Accept either account_code+debit/credit or legacy account_id+debit_cents/credit_cents
    const normalizedLines = await Promise.all(
      payload.lines.map(async (line) => {
        let accountId = (line as any).account_id as number | undefined;
        if (!accountId && (line as any).account_code) {
          const acc = await findWhere<AccountRow>("accounts", {
            code: (line as any).account_code,
          });
          accountId = acc[0]?.id;
        }

        // Use integer minor units; expect 'debit'/'credit' fields if present, else fallback to *_cents
        const d = (line as any).debit ?? (line as any).debit_cents ?? 0;
        const c = (line as any).credit ?? (line as any).credit_cents ?? 0;

        if (!Number.isInteger(d) || !Number.isInteger(c) || d < 0 || c < 0) {
          throw Object.assign(
            new Error("Amounts must be integer minor units >= 0"),
            { status: 400 }
          );
        }
        if (!accountId || (d > 0 && c > 0) || (d === 0 && c === 0)) {
          throw Object.assign(
            new Error(
              "Each line must have a valid account and exactly one of debit or credit > 0"
            ),
            { status: 400 }
          );
        }

        debitSum += d;
        creditSum += c;
        return { account_id: accountId, debit_cents: d, credit_cents: c };
      })
    );

    if (debitSum !== creditSum) {
      res.status(400).json({ error: "Debits and credits must balance" });
      return;
    }

    // Optionally validate account existence
    const accountIds = [...new Set(normalizedLines.map((l) => l.account_id))];
    const missingAccounts: number[] = [];
    for (const id of accountIds) {
      const rows = await findWhere<AccountRow>("accounts", { id });
      if (rows.length === 0) missingAccounts.push(id);
    }
    if (missingAccounts.length) {
      res
        .status(400)
        .json({ error: `Invalid account_id(s): ${missingAccounts.join(",")}` });
      return;
    }

    // If idempotency indicates existing, try to fetch and return existing resource
    const idem = (req as any).idempotency as
      | { key_hash?: string; existing?: any }
      | undefined;
    if (idem?.existing?.entry_id) {
      const existing = await findById<JournalEntryRow>(
        "journal_entries",
        idem.existing.entry_id
      );
      if (existing) {
        res.status(200).json({ data: existing, idempotent: true });
        return;
      }
    }

    const result = await withTransaction(async () => {
      const entryInsert = await insert("journal_entries", {
        date: payload.date,
        narration: payload.narration,
        reverses_entry_id: payload.reverses_entry_id ?? null,
      });

      const entryId = entryInsert.insertId;

      let idx = 0;
      for (const line of normalizedLines) {
        idx += 1;
        await insert("journal_lines", {
          entry_id: entryId,
          account_id: line.account_id,
          debit_cents: line.debit_cents || 0,
          credit_cents: line.credit_cents || 0,
          line_index: idx,
        });
      }

      return entryId;
    });

    if (idem?.key_hash) {
      await idempotencyService.markIdempotencySuccess(idem.key_hash, result);
    }

    const created = await findById<JournalEntryRow>("journal_entries", result);
    res.status(201).json({ data: created });
    return;
  } catch (err) {
    next(err);
    return;
  }
}

// GET /journal-entries/:id -> fetch entry with lines
export async function getJournalEntry(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const entry = await findById<JournalEntryRow>("journal_entries", id);
    if (!entry) {
      res.status(404).json({ error: "Journal entry not found" });
      return;
    }
    const lines = await query<any[]>(
      `SELECT jl.*, a.code as account_code, a.name as account_name FROM journal_lines jl
       JOIN accounts a ON a.id = jl.account_id
       WHERE jl.entry_id = ? ORDER BY jl.line_index ASC`,
      [id]
    );
    res.json({ data: { ...entry, lines } });
    return;
  } catch (err) {
    next(err);
    return;
  }
}
