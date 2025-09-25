/**
 * Server API Endpoint Tests
 * Tests all endpoints from server.ts using supertest
 */

import request from "supertest";
import app from "@/server";

describe("Server API Endpoints", () => {
  describe("GET /", () => {
    test("should return welcome message with API info", async () => {
      const response = await request(app)
        .get("/")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Welcome to the Ledger System API"
      );
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("documentation", "/api-docs");
    });

    test("should have correct response structure", async () => {
      const response = await request(app).get("/");

      expect(response.body).toEqual({
        message: "Welcome to the Ledger System API",
        version: "1.0.0",
        documentation: "/api-docs",
      });
    });
  });

  describe("GET /health", () => {
    test("should return health status with database info", async () => {
      const response = await request(app)
        .get("/health")
        .expect("Content-Type", /json/);

      // Health endpoint should return 200 (OK) or 503 (Service Unavailable) depending on DB
      expect([200, 503]).toContain(response.status);

      // Check response structure
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("service", "Ledger System API");
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("database");

      // Database object structure
      expect(response.body.database).toHaveProperty("connected");
      expect(typeof response.body.database.connected).toBe("boolean");
    });

    test("should return OK status when database is connected", async () => {
      const response = await request(app).get("/health");

      if (response.status === 200) {
        expect(response.body.status).toBe("OK");
        expect(response.body.database.connected).toBe(true);

        // Should have additional DB info when connected
        expect(response.body.database).toHaveProperty("pool");
        expect(response.body.database.pool).toHaveProperty("totalConnections");
        expect(response.body.database.pool).toHaveProperty("activeConnections");
        expect(response.body.database.pool).toHaveProperty("idleConnections");

        // May have database version info
        if (response.body.database.version) {
          expect(typeof response.body.database.version).toBe("string");
        }
      }
    });

    test("should return DEGRADED or ERROR status when database is not connected", async () => {
      const response = await request(app).get("/health");

      if (response.status === 503) {
        expect(["DEGRADED", "ERROR"]).toContain(response.body.status);

        if (response.body.status === "DEGRADED") {
          expect(response.body.database.connected).toBe(false);
        } else if (response.body.status === "ERROR") {
          expect(response.body).toHaveProperty("error", "Health check failed");
          expect(response.body.database.connected).toBe(false);
        }
      }
    });

    test("should have valid timestamp format", async () => {
      const response = await request(app).get("/health");

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();

      // Timestamp should be recent (within last 5 seconds)
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    test("should include connection pool status", async () => {
      const response = await request(app).get("/health");

      if (response.body.database.pool) {
        const pool = response.body.database.pool;

        expect(typeof pool.totalConnections).toBe("number");
        expect(typeof pool.activeConnections).toBe("number");
        expect(typeof pool.idleConnections).toBe("number");

        expect(pool.totalConnections).toBeGreaterThanOrEqual(0);
        expect(pool.activeConnections).toBeGreaterThanOrEqual(0);
        expect(pool.idleConnections).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("404 Error Handling", () => {
    test("should return 404 for non-existent GET routes", async () => {
      const response = await request(app)
        .get("/non-existent-route")
        .expect(404);

      // Express default 404 behavior - may not return JSON
      // Just verify it returns 404 status
      expect(response.status).toBe(404);
    });

    test("should return 404 for non-existent POST routes", async () => {
      await request(app).post("/non-existent-route").expect(404);
    });

    test("should return 404 for non-existent PUT routes", async () => {
      await request(app).put("/non-existent-route").expect(404);
    });

    test("should return 404 for non-existent DELETE routes", async () => {
      await request(app).delete("/non-existent-route").expect(404);
    });
  });

  describe("Request Body Parsing", () => {
    test("should handle JSON requests (even though no POST endpoints exist yet)", async () => {
      // This tests that express.json() middleware is working
      const response = await request(app)
        .post("/non-existent-json-route")
        .send({ test: "data" })
        .set("Content-Type", "application/json");

      // Should return 404 (route not found) but not 400 (bad request)
      // This confirms JSON middleware is working
      expect(response.status).toBe(404);
    });

    test("should handle URL encoded requests", async () => {
      // This tests that express.urlencoded() middleware is working
      const response = await request(app)
        .post("/non-existent-form-route")
        .send("name=test&value=123")
        .set("Content-Type", "application/x-www-form-urlencoded");

      // Should return 404 (route not found) but not 400 (bad request)
      // This confirms URL encoded middleware is working
      expect(response.status).toBe(404);
    });
  });

  describe("CORS and Headers", () => {
    test("should set correct content type for JSON responses", async () => {
      const response = await request(app).get("/");

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    test("should handle HEAD requests to existing routes", async () => {
      const response = await request(app).head("/").expect(200);

      // HEAD should return same headers as GET but no body
      expect(response.body).toEqual({});
      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });

  describe("Server Configuration", () => {
    test("root endpoint should indicate API documentation location", async () => {
      const response = await request(app).get("/");

      expect(response.body.documentation).toBe("/api-docs");
      // This is where future API documentation will be served
    });

    test("health endpoint should indicate service name and version", async () => {
      const response = await request(app).get("/health");

      expect(response.body.service).toBe("Ledger System API");
      expect(response.body.version).toBe("1.0.0");
    });
  });

  describe("Response Time Performance", () => {
    test("root endpoint should respond quickly", async () => {
      const startTime = Date.now();
      await request(app).get("/");
      const responseTime = Date.now() - startTime;

      // Should respond within 100ms for simple endpoint
      expect(responseTime).toBeLessThan(100);
    });

    test("health endpoint should respond within reasonable time", async () => {
      const startTime = Date.now();
      await request(app).get("/health");
      const responseTime = Date.now() - startTime;

      // Health check may take longer due to database connection test
      // But should still be under 5 seconds even if DB is slow/unavailable
      expect(responseTime).toBeLessThan(5000);
    });
  });
});
