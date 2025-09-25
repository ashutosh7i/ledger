import express, { Express, Request, Response } from "express";
import { config } from "@/configs/app.config";

const app: Express = express();
const port = config.port || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Ledger System API",
  });
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
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(
    `📖[docs]: API documentation will be available at http://localhost:${port}/api-docs`
  );
});

export default app;
