import { Request, Response, NextFunction } from "express";
import {
  AccountRow,
  AccountType,
  CreateAccountDTO,
  UpdateAccountDTO,
} from "@/models/account.model";
import {
  findAll,
  findById,
  findWhere,
  insert,
  updateById,
  deleteById,
} from "@/repositories/base.repository";

const TABLE = "accounts";

export async function listAccounts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const type = (req.query.type as AccountType | undefined) || undefined;
    const rows = type
      ? await findWhere<AccountRow>(TABLE, { type }, "code ASC")
      : await findAll<AccountRow>(TABLE, "code ASC");
    res.json({ data: rows });
    return;
  } catch (err) {
    next(err);
    return;
  }
}

export async function getAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const row = await findById<AccountRow>(TABLE, id);
    if (!row) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json({ data: row });
    return;
  } catch (err) {
    next(err);
    return;
  }
}

export async function createAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: CreateAccountDTO = req.body;
    if (!body?.code || !body?.name || !body?.type) {
      res.status(400).json({ error: "code, name, type are required" });
      return;
    }

    const exists = await findWhere<AccountRow>(TABLE, { code: body.code });
    if (exists.length) {
      res.status(409).json({ error: "Account code already exists" });
      return;
    }

    const result = await insert(TABLE, body as any);
    const created = await findById<AccountRow>(TABLE, result.insertId);
    res.status(201).json({ data: created });
    return;
  } catch (err) {
    next(err);
    return;
  }
}

export async function updateAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const body: UpdateAccountDTO = req.body || {};
    const row = await findById<AccountRow>(TABLE, id);
    if (!row) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    await updateById(TABLE, id, body as any);
    const updated = await findById<AccountRow>(TABLE, id);
    res.json({ data: updated });
    return;
  } catch (err) {
    next(err);
    return;
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const row = await findById<AccountRow>(TABLE, id);
    if (!row) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    await deleteById(TABLE, id);
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
    return;
  }
}

// GET /accounts/:code/balance?as_of=YYYY-MM-DD
import { query } from "@/services/database.service";
export async function getAccountBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const code = req.params.code;
    const asOf = (req.query.as_of as string | undefined) || undefined;

    const accounts = await findWhere<AccountRow>(TABLE, { code });
    const account = accounts[0];
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    const params: any[] = [account.id];
    let sql = `
      SELECT 
        COALESCE(SUM(jl.debit_cents), 0) AS debits,
        COALESCE(SUM(jl.credit_cents), 0) AS credits
      FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.entry_id
      WHERE jl.account_id = ?`;
    if (asOf) {
      sql += ` AND je.date <= ?`;
      params.push(asOf);
    }
    const rows = await query<any[]>(sql, params);
    const debits = Number(rows?.[0]?.debits || 0);
    const credits = Number(rows?.[0]?.credits || 0);
    const balance = debits - credits; // debit-normal positive, credit-normal negative

    res.json({
      account: { code: account.code, name: account.name, type: account.type },
      as_of: asOf || null,
      debits,
      credits,
      balance,
    });
    return;
  } catch (err) {
    next(err);
    return;
  }
}
