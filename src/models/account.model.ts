import { RowDataPacket } from "mysql2/promise";

export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Revenue"
  | "Expense";

export interface AccountRow extends RowDataPacket {
  id: number;
  code: string; // unique account code like 1000, 2000, etc.
  name: string;
  type: AccountType;
  created_at: string; // ISO string from DB TIMESTAMP
  updated_at: string; // ISO string from DB TIMESTAMP
}

export interface CreateAccountDTO {
  code: string;
  name: string;
  type: AccountType;
}

export interface UpdateAccountDTO {
  name?: string;
}
