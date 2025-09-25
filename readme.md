# Basic Ledger System

This is a WIP double-entry ledger API built with Express + TypeScript + MySQL.

## Quick start

- Install deps: npm install
- Initialize DB: npm run db:init
- Dev server: npm run dev

## Endpoints (WIP)

- GET / — welcome
- GET /health — service and DB health
- API base path: /api/v1
  - Accounts
    - GET /accounts
    - GET /accounts/:id
    - POST /accounts (requires header x-api-key)
    - PUT /accounts/:id (requires header x-api-key)
    - DELETE /accounts/:id (requires header x-api-key)
  - Journal
    - POST /journal/entries (requires headers x-api-key, optional Idempotency-Key)

Headers

- x-api-key: seeded from DEFAULT_API_KEY in .env (dev value provided in app.config)
- Idempotency-Key: provide a unique string to safely retry POST /journal/entries with the same request body

## Notes

- Database schema can be reinitialized with: npm run db:reset
- Tests: npm test
