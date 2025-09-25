import request from "supertest";
import app from "@/server";
import { dbInit } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";
import { ensureDefaultApiKey } from "@/services/security.service";
import { config } from "@/configs/app.config";

const API_KEY = config.apiKeys.defaultKey;

describe("Accounts routes", () => {
  beforeAll(async () => {
    if (!(await testConnection())) throw new Error("DB not connected");
    await dbInit.dropAllTables();
    await dbInit.initializeDatabase();
    await ensureDefaultApiKey();
  });

  afterAll(async () => {
    await closePool();
  });

  let createdId: number;

  test("POST /accounts requires api key", async () => {
    const r401 = await request(app)
      .post("/api/v1/accounts")
      .send({ code: "9001", name: "Test", type: "Asset" });
    expect(r401.status).toBe(401);
  });

  test("POST /accounts creates account", async () => {
    const res = await request(app)
      .post("/api/v1/accounts")
      .set("x-api-key", API_KEY)
      .send({ code: "1001", name: "Cash", type: "Asset" })
      .expect(201);

    expect(res.body.data.code).toBe("1001");
    createdId = res.body.data.id;
  });

  test("GET /accounts lists accounts and filters by type", async () => {
    await request(app)
      .post("/api/v1/accounts")
      .set("x-api-key", API_KEY)
      .send({ code: "4001", name: "Sales", type: "Revenue" })
      .expect(201);

    const list = await request(app).get("/api/v1/accounts").expect(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    const onlyAssets = await request(app)
      .get("/api/v1/accounts?type=Asset")
      .expect(200);
    expect(onlyAssets.body.data.every((a: any) => a.type === "Asset")).toBe(
      true
    );
  });

  test("GET /accounts/:id returns one", async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/${createdId}`)
      .expect(200);
    expect(res.body.data.id).toBe(createdId);
  });

  test("PUT /accounts/:id updates name", async () => {
    const res = await request(app)
      .put(`/api/v1/accounts/${createdId}`)
      .set("x-api-key", API_KEY)
      .send({ name: "Cash on Hand" })
      .expect(200);
    expect(res.body.data.name).toBe("Cash on Hand");
  });

  test("DELETE /accounts/:id removes account", async () => {
    await request(app)
      .delete(`/api/v1/accounts/${createdId}`)
      .set("x-api-key", API_KEY)
      .expect(204);
  });
});
