import express, { Express, Request, Response } from "express";
import { config } from "@/configs/app.config";
import {
  testConnection,
  getDatabaseInfo,
  getPoolStatus,
  closePool,
} from "@/services/database.service";

const app: Express = express();
const port = config.port || 3000;

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

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Ledger System API",
    version: "1.0.0",
    documentation: "/api-docs",
  });
});

// Start server
const startServer = async () => {
  try {
    console.log("🔄[startup]: Initializing application...");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn(
        "⚠️[startup]: Database connection failed. Some features may not work."
      );
      console.log(
        "�[startup]: Run 'npm run db:init' to initialize the database"
      );
    } else {
      console.log("✅[startup]: Database connection established");
    }

    // Start HTTP server
    const server = app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
      console.log(
        `📖[docs]: API documentation will be available at http://localhost:${port}/api-docs`
      );
      console.log(
        `🔍[health]: Health check available at http://localhost:${port}/health`
      );

      if (!dbConnected) {
        console.log(
          "💡[server]: To initialize the database, run: npm run db:init"
        );
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log(
        "📱[shutdown]: Received shutdown signal, closing server gracefully..."
      );

      server.close(async () => {
        console.log("🔌[shutdown]: HTTP server closed.");

        try {
          await closePool();
          console.log("💾[shutdown]: Database connections closed.");
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
