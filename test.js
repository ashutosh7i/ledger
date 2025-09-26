
const API_URL = "http://localhost:5000/api/v1";
const API_KEY = "dev-api-key-123";

const headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
};

// Helper to log responses
const log = async (label, promise) => {
    try {
        const res = await promise;
        const data = await res.json();
        console.log(`\n=== ${label} ===\n`, data);
        return data;
    } catch (err) {
        console.error(`Error in ${label}:`, err);
        return null;
    }
};

// Generate random 4-digit code
const generateRandomCode = () => (Math.floor(Math.random() * 9000) + 1000).toString();

async function runTests() {
    console.log("🔹 Starting Ledger API tests...");

    // 1️⃣ Create accounts with random codes
    const accountDefinitions = [
        { name: "Cash", type: "Asset" },
        { name: "Bank", type: "Asset" },
        { name: "Capital", type: "Equity" },
        { name: "Sales", type: "Revenue" },
        { name: "Rent", type: "Expense" },
    ];

    const accountMap = {}; // name -> account object

    for (const acc of accountDefinitions) {
        const code = generateRandomCode();
        const payload = { code, name: acc.name, type: acc.type };

        const data = await log(`Create account ${acc.name}`,
            fetch(`${API_URL}/accounts`, { method: "POST", headers, body: JSON.stringify(payload) })
        );

        if (data?.data?.code) {
            accountMap[acc.name] = data.data;
            console.log(`✅ Account created: ${acc.name} (Code: ${data.data.code})`);
        } else {
            console.error(`❌ Failed to create account: ${acc.name}`);
        }
    }

    // 2️⃣ Post journal entries
    const journalEntries = [
        {
            date: "2025-01-01",
            narration: "Seed capital",
            lines: [
                { account_name: "Cash", debit: 100000, credit: 0 },
                { account_name: "Capital", debit: 0, credit: 100000 },
            ],
        },
        {
            date: "2025-01-05",
            narration: "Cash sale",
            lines: [
                { account_name: "Cash", debit: 50000, credit: 0 },
                { account_name: "Sales", debit: 0, credit: 50000 },
            ],
        },
        {
            date: "2025-01-07",
            narration: "Office rent",
            lines: [
                { account_name: "Rent", debit: 20000, credit: 0 },
                { account_name: "Cash", debit: 0, credit: 20000 },
            ],
        },
    ];

    const journalEntryIds = [];

    for (const entry of journalEntries) {
        const lines = entry.lines.map(line => ({
            account_code: accountMap[line.account_name].code,
            debit: line.debit,
            credit: line.credit,
        }));

        const result = await log(`Post journal entry: ${entry.narration}`,
            fetch(`${API_URL}/journal/journal-entries`, {
                method: "POST",
                headers: { ...headers, "Idempotency-Key": `key-${Math.random()}` },
                body: JSON.stringify({ date: entry.date, narration: entry.narration, lines }),
            })
        );

        if (result?.data?.id) {
            journalEntryIds.push(result.data.id);
            console.log(`✅ Journal entry posted: ${entry.narration}`);
        } else {
            console.error(`❌ Failed to post journal entry: ${entry.narration}`);
        }
    }

    // 3️⃣ Fetch individual journal entries by ID
    for (const id of journalEntryIds) {
        const entry = await log(`Fetch journal entry ID ${id}`,
            fetch(`${API_URL}/journal/journal-entries/${id}`, { headers })
        );

        if (entry?.data?.id === id) console.log(`✅ Fetched journal entry ID ${id}`);
        else console.error(`❌ Failed to fetch journal entry ID ${id}`);
    }

    // 4️⃣ Fetch balances
    console.log("\n🔹 Checking account balances as of 2025-01-31");
    for (const name of Object.keys(accountMap)) {
        const code = accountMap[name].code;
        const data = await log(`${name} balance`,
            fetch(`${API_URL}/accounts/${code}/balance?as_of=2025-01-31`, { headers })
        );

        if (data?.balance !== undefined) console.log(`✅ Balance for ${name}: ${data.balance}`);
        else console.error(`❌ Failed to fetch balance for ${name}`);
    }

    // 5️⃣ Fetch trial balance
    const trialBalance = await log("Trial balance 2025-01-01 to 2025-01-31",
        fetch(`${API_URL}/reports/trial-balance?from=2025-01-01&to=2025-01-31`, { headers })
    );

    if (trialBalance?.totals) {
        const { debits, credits } = trialBalance.totals;
        if (debits === credits) {
            console.log(`✅ Trial balance is correct: Debits = Credits = ${debits}`);
        } else {
            console.error(`❌ Trial balance mismatch: Debits = ${debits}, Credits = ${credits}`);
        }
    } else {
        console.error("❌ Failed to fetch trial balance");
    }

    console.log("\n🔹 Ledger API tests completed.");
}

runTests();
