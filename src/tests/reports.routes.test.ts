import request from "supertest";
import app from "@/server";
import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";
import { ensureDefaultApiKey } from "@/services/security.service";
import { insert } from "@/repositories/base.repository";

describe("Reports routes", () => {
  beforeAll(async () => {
    if (!(await testConnection())) throw new Error("DB not connected");
    await dbInit.dropAllTables();
    await dbInit.initializeDatabase();
    await ensureDefaultApiKey();

    const cash = (
      await insert("accounts", { code: "1001", name: "Cash", type: "Asset" })
    ).insertId;
    const sales = (
      await insert("accounts", { code: "4001", name: "Sales", type: "Revenue" })
    ).insertId;

    const entry = await insert("journal_entries", {
      date: "2025-01-01",
      narration: "Sale",
    });
    await insert("journal_lines", {
      entry_id: entry.insertId,
      account_id: cash,
      debit_cents: 500,
      credit_cents: 0,
      line_index: 1,
    });
    await insert("journal_lines", {
      entry_id: entry.insertId,
      account_id: sales,
      debit_cents: 0,
      credit_cents: 500,
      line_index: 2,
    });
  });

  afterAll(async () => {
    await closePool();
  });

  test("GET account balance as_of", async () => {
    const r = await request(app)
      .get("/api/v1/accounts/1001/balance?as_of=2025-01-31")
      .expect(200);
    expect(r.body.debits).toBe(500);
    expect(r.body.credits).toBe(0);
    expect(r.body.balance).toBe(500);
  });

  test("GET trial balance range", async () => {
    const r = await request(app)
      .get("/api/v1/reports/trial-balance?from=2025-01-01&to=2025-01-31")
      .expect(200);
    expect(r.body.totals.debits).toBe(r.body.totals.credits);
    const cash = r.body.accounts.find((a: any) => a.code === "1001");
    expect(cash.balance).toBe(500);
  });
});
