# Barton Chores

Family chores + pocket money app with adult approvals, kid autonomy, and a ledger-only money model. This version runs entirely in the browser using LocalStorage (no backend required).

## Features
- Parent vs kid views with a simple role picker
- Kid "Today" list, completion requests, and ledger view
- Parent approval inbox, per-kid balances, and payday payouts
- Ledger-only accounting (no mutable balance column)
- Export/Import JSON for backups or sharing

## Run locally
```bash
npm install
npm run dev
```
Visit `http://localhost:5173`.

## Run on StackBlitz
1. Create a new Vite + React + TypeScript project on StackBlitz.
2. Replace the generated files with the contents of this repo.
3. Run the `dev` script inside StackBlitz.

## Notes
- Monetary values are stored in pence as integers.
- Ledger entries track earnings and payouts; balances are computed on the fly.
