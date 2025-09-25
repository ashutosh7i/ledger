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
    for (const line of payload.lines) {
      const d = line.debit_cents || 0;
      const c = line.credit_cents || 0;
      if (!line.account_id || (d > 0 && c > 0) || (d === 0 && c === 0)) {
        res
          .status(400)
          .json({
            error:
              "Each line must have account_id and either debit_cents or credit_cents",
          });
        return;
      }
      debitSum += d;
      creditSum += c;
    }

    if (debitSum !== creditSum) {
      res.status(400).json({ error: "Debits and credits must balance" });
      return;
    }

    // Optionally validate account existence
    const accountIds = [...new Set(payload.lines.map((l) => l.account_id))];
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
      for (const line of payload.lines) {
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
