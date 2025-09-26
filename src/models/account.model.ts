import { RowDataPacket } from "mysql2/promise";

import { AccountType } from "@/types/accountType";
export { AccountType };

export interface AccountRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountDTO {
  code: string;
  name: string;
  type: AccountType;
}

export interface UpdateAccountDTO {
  name?: string;
}
