import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    name: process.env.DB_NAME || "ledger_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
  },
  apiKeys: {
    defaultKey: process.env.DEFAULT_API_KEY || "dev-api-key-123",
  },
} as const;

export type Config = typeof config;
