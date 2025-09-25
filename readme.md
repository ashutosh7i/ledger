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
