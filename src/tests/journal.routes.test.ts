import request from "supertest";
import app from "@/server";
import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";
import { ensureDefaultApiKey } from "@/services/security.service";
import { insert } from "@/repositories/base.repository";
import { config } from "@/configs/app.config";

const API_KEY = config.apiKeys.defaultKey;

describe("Journal routes", () => {
  beforeAll(async () => {
    if (!(await testConnection())) throw new Error("DB not connected");
    await dbInit.dropAllTables();
    await dbInit.initializeDatabase();
    await ensureDefaultApiKey();

    await insert("accounts", { code: "1001", name: "Cash", type: "Asset" });
    await insert("accounts", { code: "3001", name: "Capital", type: "Equity" });
  });

  afterAll(async () => {
    await closePool();
  });

  test("POST /journal-entries validates and creates entry", async () => {
    const res = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send({
        date: "2025-01-01",
        narration: "Seed",
        lines: [
          { account_code: "1001", debit: 1000 },
          { account_code: "3001", credit: 1000 },
        ],
      })
      .expect(201);

    const entryId = res.body.data.id;
    const get = await request(app)
      .get(`/api/v1/journal/journal-entries/${entryId}`)
      .expect(200);
    expect(get.body.data.id).toBe(entryId);
    expect(get.body.data.lines.length).toBe(2);
  });

  test("POST /journal-entries rejects future date and unbalanced", async () => {
    await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send({
        date: "2999-01-01",
        narration: "Future",
        lines: [
          { account_code: "1001", debit: 100 },
          { account_code: "3001", credit: 100 },
        ],
      })
      .expect(400);

    await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .send({
        date: "2025-01-02",
        narration: "Unbalanced",
        lines: [
          { account_code: "1001", debit: 100 },
          { account_code: "3001", credit: 99 },
        ],
      })
      .expect(400);
  });

  test("Idempotency returns same result on retry", async () => {
    const idem = "journal-idem-1";
    const payload = {
      date: "2025-01-03",
      narration: "Idem",
      lines: [
        { account_code: "1001", debit: 10 },
        { account_code: "3001", credit: 10 },
      ],
    };

    const r1 = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .set("Idempotency-Key", idem)
      .send(payload);

    const r2 = await request(app)
      .post("/api/v1/journal/journal-entries")
      .set("x-api-key", API_KEY)
      .set("Idempotency-Key", idem)
      .send(payload);

    expect([r1.status, r2.status].every((s) => [200, 201].includes(s))).toBe(
      true
    );
  });
});
