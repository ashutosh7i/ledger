import { Request, Response, NextFunction } from "express";
import {
  AccountRow,
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
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rows = await findAll<AccountRow>(TABLE, "code ASC");
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
