import express, { Express, Request, Response, NextFunction } from "express";
import { config } from "@/configs/app.config";
import {
  testConnection,
  getDatabaseInfo,
  getPoolStatus,
  closePool,
} from "@/services/database.service";
import apiRouter from "@/routes";
import { notFoundHandler, errorHandler } from "@/middlewares/auth.middleware";
import { ensureDefaultApiKey } from "@/services/security.service";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import logger from "@/utils/logger";

const app: Express = express();
const port = config.port || 3000;
const swaggerDocument = YAML.load("./openapi.yaml");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const dbConnected = await testConnection();
    const dbInfo = dbConnected ? await getDatabaseInfo() : null;
    const poolStatus = getPoolStatus();

    const healthData = {
      status: dbConnected ? "OK" : "DEGRADED",
      timestamp: new Date().toISOString(),
      service: "Ledger System API",
      version: "1.0.0",
      database: {
        connected: dbConnected,
        ...(dbInfo && {
          version: dbInfo.version,
          database: dbInfo.database,
          uptime: dbInfo.uptime,
        }),
        pool: poolStatus,
      },
    };

    res.status(dbConnected ? 200 : 503).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      service: "Ledger System API",
      error: "Health check failed",
      database: {
        connected: false,
      },
    });
  }
});

// Serve static HTML tester at root
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Swagger API docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount versioned API routes
app.use("/api/v1", apiRouter);

// 404 and error handlers (must be after routes)
app.use(notFoundHandler);
app.use(
  errorHandler as unknown as (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void
);

// Start server
const startServer = async () => {
  try {
    logger.info("🔄[startup]: Initializing application...");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn(
        "⚠️[startup]: Database connection failed. Some features may not work."
      );
      logger.info(
        "🔄[startup]: Run 'npm run db:init' to initialize the database"
      );
    } else {
      logger.info("✅[startup]: Database connection established");
    }

    // Ensure default API key exists for local/dev
    try {
      await ensureDefaultApiKey();
    } catch {
      /* ignore */
    }

    // Start HTTP server
    const server = app.listen(port, () => {
      logger.info(`⚡️[server]: Server is running at http://localhost:${port}`);
      logger.info(
        `📖[docs]: API documentation will be available at http://localhost:${port}/api-docs`
      );
      logger.info(
        `🔍[health]: Health check available at http://localhost:${port}/health`
      );

      if (!dbConnected) {
        logger.info(
          "💡[server]: To initialize the database, run: npm run db:init"
        );
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info(
        "📱[shutdown]: Received shutdown signal, closing server gracefully..."
      );

      server.close(async () => {
        logger.info("🔌[shutdown]: HTTP server closed.");

        try {
          await closePool();
          logger.info("💾[shutdown]: Database connections closed.");
          process.exit(0);
        } catch (error) {
          console.error("❌[shutdown]: Error during database shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    console.error("❌[startup]: Application startup failed:", error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;
