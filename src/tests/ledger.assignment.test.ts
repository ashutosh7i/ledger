import request from "supertest";
import app from "@/server";
import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";
import { insert } from "@/repositories/base.repository";
import { config } from "@/configs/app.config";
import { ensureDefaultApiKey } from "@/services/security.service";

const API_KEY = config.apiKeys.defaultKey;

describe("Assignment endpoints and scenario", () => {
  beforeAll(async () => {
    if (!(await testConnection())) throw new Error("DB not connected");
    await dbInit.dropAllTables();
    await dbInit.initializeDatabase();
    await ensureDefaultApiKey();
    // Seed minimal chart of accounts
    await insert("accounts", { code: "1001", name: "Cash", type: "Asset" });
    await insert("accounts", { code: "1002", name: "Bank", type: "Asset" });
    await insert("accounts", { code: "4001", name: "Sales", type: "Revenue" });
    await insert("accounts", { code: "3001", name: "Capital", type: "Equity" });
    await insert("accounts", { code: "5001", name: "Rent", type: "Expense" });
  });

  afterAll(async () => {
    await closePool();
  });

  test("Accounts filter by type", async () => {
    const res = await request(app).get("/api/v1/accounts?type=Asset");
    expect(res.status).toBe(200);
    expect(res.body.data.every((a: any) => a.type === "Asset")).toBe(true);
  });

  test("Post journal entry with account_code and idempotency", async () => {
    const payload = {
      date: "2025-01-01",
      narration: "Seed capital",
      lines: [
        { account_code: "1001", debit: 100000 },
        { account_code: "3001", credit: 100000 },
      ],
    };
    const idemKey = "test-idem-1";

    const r1 = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .set("Idempotency-Key", idemKey)
      .send(payload);
    expect([201, 200]).toContain(r1.status);

    const r2 = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .set("Idempotency-Key", idemKey)
      .send(payload);
    expect([200, 201]).toContain(r2.status);
  });

  test("Reject future-dated or unbalanced entries", async () => {
    const future = {
      date: "2999-01-01",
      narration: "Future",
      lines: [
        { account_code: "1001", debit: 100 },
        { account_code: "3001", credit: 100 },
      ],
    };
    const rFuture = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send(future);
    expect(rFuture.status).toBe(400);

    const unbalanced = {
      date: "2025-01-02",
      narration: "Unbalanced",
      lines: [
        { account_code: "1001", debit: 100 },
        { account_code: "3001", credit: 99 },
      ],
    };
    const rUnbalanced = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send(unbalanced);
    expect(rUnbalanced.status).toBe(400);
  });

  test("Reject duplicate account in journal entry", async () => {
    const payload = {
      date: "2025-01-10",
      narration: "Invalid duplicate account",
      lines: [
        { account_code: "1001", debit: 500 },
        { account_code: "1001", credit: 500 },
      ],
    };
    const res = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/only appear once/);
  });

  test("Complete starter scenario then check balances and trial balance", async () => {
    // Cash sale: Dr Cash 50,000; Cr Sales 50,000 (2025-01-05)
    await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send({
        date: "2025-01-05",
        narration: "Cash sale",
        lines: [
          { account_code: "1001", debit: 50000 },
          { account_code: "4001", credit: 50000 },
        ],
      })
      .expect(201);

    // Office rent: Dr Rent 20,000; Cr Cash 20,000 (2025-01-07)
    await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send({
        date: "2025-01-07",
        narration: "Office rent",
        lines: [
          { account_code: "5001", debit: 20000 },
          { account_code: "1001", credit: 20000 },
        ],
      })
      .expect(201);

    // Cash balance
    const bal = await request(app).get(
      "/api/v1/accounts/1001/balance?as_of=2025-01-31"
    );
    expect(bal.status).toBe(200);
    expect(bal.body.balance).toBe(130000);

    // Trial balance
    const tb = await request(app)
      .get("/api/v1/reports/trial-balance?from=2025-01-01&to=2025-01-31")
      .expect(200);

    const totals = tb.body.totals;
    expect(totals.debits).toBe(totals.credits);
    const cash = tb.body.accounts.find((a: any) => a.code === "1001");
    expect(cash.balance).toBe(130000);
    const sales = tb.body.accounts.find((a: any) => a.code === "4001");
    expect(sales.balance).toBe(-50000);
    const rent = tb.body.accounts.find((a: any) => a.code === "5001");
    expect(rent.balance).toBe(20000);
  });
});
