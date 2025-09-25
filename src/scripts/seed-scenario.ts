import { insert, findWhere } from "@/repositories/base.repository";
import { initializeDatabase } from "@/services/database-init.service";
import { testConnection, closePool } from "@/services/database.service";

async function ensureAccount(code: string, name: string, type: string) {
  const existing = await findWhere<any>("accounts", { code });
  if (existing.length) return existing[0].id as number;
  const res = await insert("accounts", { code, name, type });
  return res.insertId;
}

async function main() {
  try {
    if (!(await testConnection())) throw new Error("DB not connected");
    await initializeDatabase();

    // Chart of accounts
    const cash = await ensureAccount("1001", "Cash", "Asset");
    const bank = await ensureAccount("1002", "Bank", "Asset");
    const sales = await ensureAccount("4001", "Sales", "Revenue");
    const capital = await ensureAccount("3001", "Capital", "Equity");
    const rent = await ensureAccount("5001", "Rent", "Expense");

    // Helper: create entry
    async function createEntry(
      date: string,
      narration: string,
      lines: Array<{
        account_id: number;
        debit_cents?: number;
        credit_cents?: number;
      }>
    ) {
      const entry = await insert("journal_entries", { date, narration });
      let idx = 0;
      for (const l of lines) {
        idx += 1;
        await insert("journal_lines", {
          entry_id: entry.insertId,
          account_id: l.account_id,
          debit_cents: l.debit_cents || 0,
          credit_cents: l.credit_cents || 0,
          line_index: idx,
        });
      }
    }

    // Seed capital: Dr Cash 100,000; Cr Capital 100,000 (2025-01-01)
    await createEntry("2025-01-01", "Seed capital", [
      { account_id: cash, debit_cents: 100000 },
      { account_id: capital, credit_cents: 100000 },
    ]);

    // Cash sale: Dr Cash 50,000; Cr Sales 50,000 (2025-01-05)
    await createEntry("2025-01-05", "Cash sale", [
      { account_id: cash, debit_cents: 50000 },
      { account_id: sales, credit_cents: 50000 },
    ]);

    // Office rent: Dr Rent 20,000; Cr Cash 20,000 (2025-01-07)
    await createEntry("2025-01-07", "Office rent", [
      { account_id: rent, debit_cents: 20000 },
      { account_id: cash, credit_cents: 20000 },
    ]);

    console.log("✓ Starter scenario seeded.");
  } catch (e) {
    console.error("Seed failed", e);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
