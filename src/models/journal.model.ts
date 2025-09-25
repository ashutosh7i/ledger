import { RowDataPacket } from "mysql2/promise";
export interface JournalEntryRow extends RowDataPacket {
  id: number;
  date: string; // YYYY-MM-DD
  narration: string;
  posted_at: string; // timestamp
  reverses_entry_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface JournalLineRow extends RowDataPacket {
  id: number;
  entry_id: number;
  account_id: number;
  debit_cents: number; // positive if debit, else 0
  credit_cents: number; // positive if credit, else 0
  line_index: number;
  created_at: string;
}

export interface CreateJournalLineDTO {
  account_id: number;
  debit_cents?: number;
  credit_cents?: number;
}

export interface CreateJournalEntryDTO {
  date: string;
  narration: string;
  lines: CreateJournalLineDTO[];
  reverses_entry_id?: number;
}
