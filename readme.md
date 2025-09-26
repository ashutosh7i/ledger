# Basic Ledger System

This project implements a **simple double-entry ledger** using **Node.js** and **MySQL**.

## What is a Double-Entry Ledger?

A **double-entry ledger** is a system used to record financial events as general entries to maintain accurate account balances. The concept was first introduced by **Luca Pacioli** in 1494 in Venice, Italy. Pacioli was an Italian merchant and is known as the father of accounting.

### Core Concept:

In a double-entry system, every business transaction affects at least two accounts:

1. **Debit (Receiving Value)**
2. **Credit (Giving Value)**

For example, if a business purchases a machine, the **asset account** increases. However, since the machine was purchased with cash, the **cash account** decreases. In this case:

* **Machine** (Asset) increases → Debit
* **Cash** (Asset) decreases → Credit

The key idea is that every transaction has dual effects, and in the end, both **debit** and **credit** should be equal.

## Classification of Accounts

Accounts can be classified into five main categories:

1. **Assets**: What the business owns or holds value in.

   * Examples: Building, Land, Machine, Inventory, Laptop.

2. **Liabilities**: What the business owes to others.

   * Examples: Bills, Repeating Payments, Loans, Taxes, Credit Purchases.

3. **Equity**: The owner's share in the business.

   * Example: If you invested ₹50 lakhs to start the business, that’s equity.
   * **Note**: Profits are not counted in equity.

4. **Revenue**: Money the business earns through operations.

   * Example: Income from sales, services, rent, or interest received.
   * If you sold a product for ₹2,000, that’s revenue.

5. **Expenses**: Money the business spends to run its operations.

   * Examples: Rent, Employee Salaries, Raw Materials, Production Costs.

### Example in Action:

Let's break it down using a simple story:

* You invest money (Equity) into the business.
* The business buys assets like **laptops** and **chairs** (Assets).
* If you have a rented office, that’s a **Liability**.
* The business earns income from sales (Revenue).
* The business pays for salaries and rent (Expenses).
## Rules of Debit and Credit

Understanding the rules of debit and credit is crucial for the ledger system. Below is a table that explains when **Debit** and **Credit** increase or decrease based on account changes.

| **Account Type**                     | **When Increase Happens**                     | **When Decrease Happens**                     |
|--------------------------------------|----------------------------------------------|----------------------------------------------|
| **Assets**                           | **Debit** increases                          | **Credit** increases                         |
| **Expenses**                         | **Debit** increases                          | **Credit** increases                         |
| **Liabilities**                      | **Credit** increases                         | **Debit** increases                          |
| **Revenue**                          | **Credit** increases                         | **Debit** increases                          |
| **Capital/Equity**                   | **Credit** increases                         | **Debit** increases                          |

### Explanations:

1. **Assets & Expenses**:
   - **Increase**: When **assets** (like cash, machines, etc.) or **expenses** (like rent, salaries, etc.) increase, the **Debit** is recorded as an increase, and the **Credit** is recorded as a decrease.
   - **Decrease**: When **assets** or **expenses** decrease, the **Credit** is recorded as an increase, and the **Debit** is recorded as a decrease.

2. **Liabilities & Revenue**:
   - **Increase**: When **liabilities** (like loans, bills, etc.), **revenue** (like sales or service income), or **capital/equity** increase, **Credit** is recorded as an increase, and **Debit** as a decrease.
   - **Decrease**: When **liabilities** or **revenue** decrease, **Debit** increases, and **Credit** decreases.

### Summary:
- **Asset & Expense increases** → **Debit** ↑, **Credit** ↓
- **Liability, Revenue, & Capital increases** → **Credit** ↑, **Debit** ↓
- **Asset & Expense decreases** → **Debit** ↓, **Credit** ↑
- **Liability, Revenue, & Capital decreases** → **Debit** ↑, **Credit** ↓

## Goal

The goal is to build a system that automatically maintains the accuracy of debit and credit entries while managing all categories of accounts.

---

## Problem Explanation

A double-entry ledger is the foundation of accounting systems. Every financial event is recorded as a journal entry with at least two line items, ensuring total debits equal total credits. This system guarantees accurate balances for all accounts (assets, liabilities, equity, revenue, expenses) over time.

## Approach

- **Correctness first**: All business logic, validation, and edge cases are handled in code.
- **Immutability**: Journal entries cannot be edited or deleted after posting. Corrections require reversal or adjustment entries.
- **Time travel**: All balance and report endpoints support historical queries.
- **Precision**: All money values use integer minor units (e.g., paise/cents).
- **API-first**: Clean, documented REST API with OpenAPI schema.

## Setup

### Requirements

- Node.js (v20+ recommended)
- MySQL

### Environment Variables

Create a `.env` file with:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=youruser
DB_PASSWORD=yourpassword
DB_NAME=ledger
API_KEY=your-api-key
```

### Install & Run

```sh
npm install
npm run db:init      # Initializes DB schema
npm run db:seed      # Seeds chart of accounts and starter scenario
npm run dev          # Starts the server
```

## API Documentation

See [`openapi.yaml`](./openapi.yaml) for the full OpenAPI schema, visit [http://localhost:5000/api-docs](http://localhost:5000/api-docs) or use the following curl examples:

### Create Account

```sh
curl -X POST http://localhost:5000/api/v1/accounts \
  -H 'x-api-key: <your-api-key>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"1001","name":"Cash","type":"Asset"}'
```

### Post Journal Entry

```sh
curl -X POST http://localhost:5000/api/v1/journal-entries \
  -H 'x-api-key: <your-api-key>' \
  -H 'Idempotency-Key: d9e5e2ab-1' \
  -H 'Content-Type: application/json' \
  -d '{"date":"2025-01-15","narration":"Seed capital","lines":[{"account_code":"1001","debit":100000},{"account_code":"3001","credit":100000}]}'
```

### Trial Balance

```sh
curl 'http://localhost:5000/api/v1/reports/trial-balance?from=2025-01-01&to=2025-01-31'
```

## Assumptions & Trade-offs

- Each account can only appear once per journal entry (no duplicate debit/credit for same account).
- All amounts are in integer minor units (no floats).
- Only a single currency is supported (INR by default).
- No external accounting libraries are used for ledger logic.

## Idempotency Implementation

- Journal entry creation supports idempotency via the `Idempotency-Key` header. Duplicate requests with the same key and body are not duplicated.

## Test Instructions

- Run all tests:

```sh
npm test
```

- Coverage summary will be shown after tests complete.

## Coverage Summary

- All endpoints, edge cases, and business logic are covered, including reversal, idempotency, rounding, and time travel.

## Starter Scenario

The seed script creates:

- Accounts: Cash (1001 Asset), Bank (1002 Asset), Sales (4001 Revenue), Capital (3001 Equity), Rent (5001 Expense)
- Entries:
  - Seed capital: Dr Cash 100,000; Cr Capital 100,000 (2025-01-01)
  - Cash sale: Dr Cash 50,000; Cr Sales 50,000 (2025-01-05)
  - Office rent: Dr Rent 20,000; Cr Cash 20,000 (2025-01-07)

Trial balance for 2025-01-01..2025-01-31 will balance; Cash balance = 130,000; Sales = -50,000 (credit-normal), Rent = 20,000.
